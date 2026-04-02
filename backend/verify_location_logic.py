import asyncio
import scraper
from database import SessionLocal, engine
import models

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

async def verify_location():
    asin = "B07H1GJZMP" # SKF 6205-2Z
    pincode_delhi = "110001"
    pincode_mumbai = "400001"

    print(f"--- Step 1: Scraping for Delhi ({pincode_delhi}) ---")
    delhi_details = await scraper.get_product_details(asin, pincode_delhi)
    if delhi_details:
        print(f"Delhi Price: ₹{delhi_details['current_price']}")
    
    print(f"\n--- Step 2: Scraping for Mumbai ({pincode_mumbai}) ---")
    mumbai_details = await scraper.get_product_details(asin, pincode_mumbai)
    if mumbai_details:
        print(f"Mumbai Price: ₹{mumbai_details['current_price']}")

    # Mocking the track logic to verify database storage
    db = SessionLocal()
    try:
        # Clear existing entries
        db.query(models.PriceHistory).filter(models.PriceHistory.asin == asin).delete()
        
        # Add Delhi entry
        h1 = models.PriceHistory(asin=asin, price=delhi_details['current_price'], pincode=pincode_delhi, seller_name="Delhi Seller")
        db.add(h1)
        
        # Add Mumbai entry
        h2 = models.PriceHistory(asin=asin, price=mumbai_details['current_price'], pincode=pincode_mumbai, seller_name="Mumbai Seller")
        db.add(h2)
        
        db.commit()
        print("\n--- Step 3: Verifying Database Isolation ---")
        
        delhi_count = db.query(models.PriceHistory).filter(models.PriceHistory.asin == asin, models.PriceHistory.pincode == pincode_delhi).count()
        mumbai_count = db.query(models.PriceHistory).filter(models.PriceHistory.asin == asin, models.PriceHistory.pincode == pincode_mumbai).count()
        
        print(f"Entries for Delhi: {delhi_count}")
        print(f"Entries for Mumbai: {mumbai_count}")
        
        if delhi_count == 1 and mumbai_count == 1:
            print("\nSUCCESS: Database successfully isolates prices by location!")
        else:
            print("\nFAILED: Pincodes are being mixed.")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(verify_location())
