from selectolax.parser import HTMLParser
import random
import asyncio
from typing import List, Dict, Optional
import time
import json
import re

from proxy_manager import manager

# Amazon.in specific URLs
SEARCH_URL = "https://www.amazon.in/s?k="
PRODUCT_URL = "https://www.amazon.in/dp/"

async def get_headers(pincode: Optional[str] = "110001"):
    # Note: ScraperAPI handles some headers, but we provide specific ones for location simulation
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8",
        "Referer": "https://www.amazon.in/",
        "Cookie": f"p13n-sc-address-zip={pincode}; i18n-prefs=INR;"
    }
    return headers

def parse_price(price_text: str) -> float:
    if not price_text:
        return 0.0
    try:
        # Extract digits and decimal point
        p_val = "".join(re.findall(r'[0-9.]', price_text.replace(",", "")))
        return float(p_val) if p_val else 0.0
    except:
        return 0.0

from urllib.parse import quote_plus

async def search_amazon(query: str, pincode: Optional[str] = "110001", page: int = 1) -> List[Dict]:
    """Search with ScraperAPI rotation, pagination and high-fidelity parsing"""
    url = f"{SEARCH_URL}{quote_plus(query)}&page={page}"
    headers = await get_headers(pincode)
    
    print(f"[Scraper] Initializing deep scan for: {query} (Page: {page}, Location: {pincode})")
    try:
        response = await manager.get(url, headers=headers)
        if not response:
            print("[Scraper] Fatal: No response from proxy manager.")
            return []
            
        if response.status_code != 200:
            print(f"[Scraper] Search failed with status {response.status_code}")
            return []
            
        print(f"[Scraper] Successfully reached Amazon ecosystem. Parsing results...")
            
        parser = HTMLParser(response.text)
        results = []
        
        containers = parser.css('div[data-component-type="s-search-result"]')
        if not containers:
            containers = [c for c in parser.css("div[data-asin]") if "s-result-item" in (c.attributes.get("class") or "")]

        for container in containers:
            try:
                # Skip Sponsored
                if container.css_first(".puis-sponsored-label-text") or container.css_first(".s-sponsored-label-text"):
                    continue

                asin = container.attributes.get("data-asin")
                if not asin or len(asin) < 10: continue
                
                # High-fidelity Amazon Title Selectors
                title_node = container.css_first(".a-size-medium.a-color-base.a-text-normal") or \
                             container.css_first(".a-size-base-plus.a-color-base.a-text-normal") or \
                             container.css_first("h2 a span") or \
                             container.css_first("h2 span")
                
                title = title_node.text().strip() if title_node else "Unknown Asset"
                
                # Cleanup if title is just "SKF" (too short to be a product name)
                if len(title) < 5 and title.lower() == "skf":
                    # Try a broader search for the text within the container
                    fallback = container.css_first("h2")
                    if fallback: title = fallback.text().strip()
                
                # Price logic with multi-modal fallbacks
                price = 0
                price_node = container.css_first(".a-price .a-offscreen") or \
                             container.css_first("span.a-price-whole") or \
                             container.css_first(".a-color-price")
                
                if price_node:
                    price = parse_price(price_node.text())

                # Out of Stock / Unavailability Detection
                is_oos = "currently unavailable" in container.text().lower() or \
                         "out of stock" in container.text().lower() or \
                         price == 0

                img_node = container.css_first("img.s-image")
                img_url = img_node.attributes.get("src") if img_node else ""
                
                results.append({
                    "asin": asin,
                    "title": title,
                    "price": price,
                    "is_out_of_stock": is_oos,
                    "image_url": img_url
                })
            except Exception as e:
                continue
            
        return results[:15]
    except Exception as e:
        print(f"[Scraper] Search failed: {e}")
        return []

async def get_product_details(asin: str, pincode: Optional[str] = "110001") -> Optional[Dict]:
    """Production-grade product extraction with Buy Box and Seller Matrix"""
    url = PRODUCT_URL + asin
    headers = await get_headers(pincode)
    
    try:
        response = await manager.get(url, headers=headers)
        if not response or response.status_code != 200:
            return None
            
        parser = HTMLParser(response.text)
        
        # 1. Basic Info
        title_node = parser.css_first("#productTitle") or parser.css_first("#title")
        title = title_node.text().strip() if title_node else "Unknown"
        
        img_node = parser.css_first("#landingImage") or parser.css_first("img.a-dynamic-image")
        img_url = img_node.attributes.get("src") if img_node else ""
        
        # 2. Advanced Price Extraction
        price = 0
        price_selectors = [
            "#price_inside_buybox",
            "#priceblock_ourprice",
            "#priceblock_dealprice",
            ".a-price.aok-align-center .a-offscreen",
            "#corePrice_desktop .a-offscreen",
            "#corePriceDisplay_desktop_feature_div .a-offscreen",
            "#apex_desktop_qualifiedBuybox_price .a-offscreen",
            "span.a-price-whole"
        ]
        
        for sel in price_selectors:
            node = parser.css_first(sel)
            if node:
                price = parse_price(node.text())
                if price > 0: break
        
        # 3. Detect "See Price in Cart" / Hidden Price
        is_hidden = "see price in cart" in response.text.lower() or "add to cart to see price" in response.text.lower()
        if is_hidden and price == 0:
            # Try to find price in JSON blobs or scripts
            script_match = re.search(r'"buyingPrice":(\d+\.?\d*)', response.text)
            if script_match:
                price = float(script_match.group(1))
        
        # 4. Availability & Buy Box Seller
        availability_node = parser.css_first("#availability") or parser.css_first(".a-color-error")
        is_oos = (availability_node and "currently unavailable" in availability_node.text().lower()) or (price == 0 and not is_hidden)
        
        seller_node = parser.css_first("#merchant-info a span") or \
                      parser.css_first("#sellerProfileTriggerId") or \
                      parser.css_first("#freshMerchantGrid .a-text-bold") or \
                      parser.css_first("#tabular-buybox .tabular-buybox-text[data-fba='true']") or \
                      parser.css_first("a#sellerProfileTriggerId")
        
        seller_name = seller_node.text().strip() if seller_node else "Amazon.in"
        if not seller_name or seller_name.lower() == "details":
             seller_name = "Amazon.in"
        
        other_sellers = []
        offer_nodes = parser.css("#mbc-box-all .a-box") or \
                      parser.css(".olp-padding-right") or \
                      parser.css(".a-box-group .a-box[role='row']")
        
        if offer_nodes:
            for node in offer_nodes:
                s_name_node = node.css_first(".a-text-bold") or node.css_first(".seller-name")
                s_price_node = node.css_first(".a-color-price") or node.css_first(".a-price .a-offscreen")
                if s_name_node and s_price_node:
                    name = s_name_node.text().strip()
                    if not name or name.lower() == "details": continue
                    
                    other_sellers.append({
                        "name": name,
                        "price": parse_price(s_price_node.text()),
                        "isFBA": "Fulfilled by Amazon" in node.text() or "Prime" in node.text() or "fba" in node.text().lower(),
                        "isBuyBox": False
                    })

        all_sellers = [{
            "name": seller_name,
            "price": price,
            "isFBA": True,
            "isBuyBox": True
        }] + other_sellers
        
        # Filter duplicates and invalid prices
        unique_sellers = {}
        for s in all_sellers:
            if s['name'] not in unique_sellers or (s['isBuyBox'] and not unique_sellers[s['name']]['isBuyBox']):
                unique_sellers[s['name']] = s
        
        return {
            "asin": asin,
            "title": title,
            "image_url": img_url,
            "current_price": price,
            "is_out_of_stock": is_oos,
            "buybox_seller": seller_name,
            "sellers": list(unique_sellers.values())
        }
    except Exception as e:
        print(f"[Scraper] Detail extraction failed for {asin}: {e}")
        return None
