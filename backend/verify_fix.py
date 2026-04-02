import asyncio
import scraper

async def verify():
    # Use the same query that was failing
    query = "SKF 6205"
    print(f"Testing search for: {query}")
    
    results = await scraper.search_amazon(query)
    
    print(f"\nFound {len(results)} results:")
    for i, res in enumerate(results):
        print(f"{i+1}. ASIN: {res['asin']} | Price: {res['price']} | Title: {res['title'][:60]}")
        
    if len(results) > 0:
        print("\nSUCCESS: Scraper is now working correctly!")
        
        # Test getting details for the first result
        asin = results[0]['asin']
        print(f"\nTesting product details for: {asin}")
        details = await scraper.get_product_details(asin)
        if details:
            print(f"Details found: {details['title']} | Price: {details['current_price']}")
        else:
            print(f"FAILED: Could not get details for {asin}")
    else:
        print("\nFAILED: Still found 0 results.")

if __name__ == "__main__":
    asyncio.run(verify())
