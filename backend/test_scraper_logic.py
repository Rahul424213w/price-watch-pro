from selectolax.parser import HTMLParser
import os

def test_extraction(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    parser = HTMLParser(html)
    results = []
    
    # Try the main selector
    containers = parser.css('div[data-component-type="s-search-result"]')
    print(f"Found {len(containers)} containers with primary selector")
    
    if not containers:
        containers = [c for c in parser.css("div[data-asin]") if "s-result-item" in (c.attributes.get("class") or "")]
        print(f"Found {len(containers)} containers with fallback selector")

    for i, container in enumerate(containers[:10]):
        asin = container.attributes.get("data-asin")
        
        # Improved Title Selectors
        title_node = container.css_first("h2 a span") or \
                     container.css_first("a h2 span") or \
                     container.css_first("h2 span") or \
                     container.css_first("h2")
        
        title = title_node.text().strip() if title_node else "N/A"
        
        # Improved Price Selectors
        price_node = container.css_first(".a-price .a-offscreen") or \
                     container.css_first("span.a-price-whole") or \
                     container.css_first(".a-color-price")
        
        price = "N/A"
        if price_node:
            p_val = price_node.text().replace(",", "").replace("₹", "").strip().split(".")[0]
            if p_val.isdigit():
                price = p_val

        sponsored = "Yes" if (container.css_first(".puis-sponsored-label-text") or container.css_first(".s-sponsored-label-text")) else "No"

        print(f"{i+1}. ASIN: {asin} | Price: {price} | Sponsored: {sponsored} | Title: {title[:50]}...")

if __name__ == "__main__":
    test_extraction("user_query_debug.html")
