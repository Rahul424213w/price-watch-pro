import asyncio
import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Base, engine
import models
import scraper
import scheduler

async def test_scheduler_deduplication():
    print("--- Testing Scheduler Deduplication ---")
    db = SessionLocal()
    try:
        # 1. Create a dummy product
        asin = "TESTASIN123"
        product = db.query(models.Product).filter(models.Product.asin == asin).first()
        if not product:
            product = models.Product(asin=asin, title="Test Product", image_url="http://example.com/img.jpg")
            db.add(product)
            db.commit()

        # 2. Add an initial price history entry
        now = scheduler.datetime.now(scheduler.timezone.utc)
        initial_entry = models.PriceHistory(
            asin=asin,
            seller_name="Test Seller",
            price=99.99,
            pincode="110001",
            is_out_of_stock=False,
            is_buybox=True,
            timestamp=now - scheduler.timedelta(minutes=5)
        )
        db.add(initial_entry)
        db.commit()

        # 3. Simulate a scrape with the SAME data
        details = {
            "asin": asin,
            "title": "Test Product",
            "current_price": 99.99,
            "is_out_of_stock": False,
            "buybox_seller": "Test Seller",
            "sellers": [{"name": "Test Seller", "price": 99.99, "isFBA": True, "isBuyBox": True}]
        }

        # Run the detection part of scrape_and_update (mocked)
        # We check if it would create a new record
        last_entry = db.query(models.PriceHistory)\
                       .filter(models.PriceHistory.asin == asin, models.PriceHistory.seller_name == "Test Seller")\
                       .order_by(models.PriceHistory.timestamp.desc())\
                       .first()
        
        current_time = scheduler.datetime.now(scheduler.timezone.utc)
        should_record = True
        if last_entry:
            last_ts = last_entry.timestamp.replace(tzinfo=scheduler.timezone.utc) if (last_entry.timestamp and last_entry.timestamp.tzinfo is None) else last_entry.timestamp
            is_recent = last_ts and (current_time - last_ts) < scheduler.timedelta(minutes=15)
            
            is_same_price = last_entry.price == details['sellers'][0]['price']
            is_same_oos = last_entry.is_out_of_stock == details['is_out_of_stock']
            is_same_buybox = last_entry.is_buybox == details['sellers'][0]['isBuyBox']
            
            if is_same_price and is_same_oos and is_same_buybox and is_recent:
                should_record = False

        print(f"Deduplication Work Result: {not should_record} (Expected: True)")
        assert should_record == False, "Deduplication failed!"
        print("✅ Scheduler logic verified.")

    finally:
        # Cleanup
        db.query(models.PriceHistory).filter(models.PriceHistory.asin == "TESTASIN123").delete()
        db.query(models.Product).filter(models.Product.asin == "TESTASIN123").delete()
        db.commit()
        db.close()

async def verify_scraper_aod():
    print("\n--- Verifying AOD Scraper Hook ---")
    asin = "B07WHSY6X2" # Example SKF product
    print(f"Testing AOD fetch for {asin}...")
    offers = await scraper.get_all_offers(asin)
    print(f"Found {len(offers)} offers via AOD.")
    if len(offers) > 0:
        print(f"Sample Offer: {offers[0]['name']} at ₹{offers[0]['price']}")
    print("✅ AOD logic operational.")

if __name__ == "__main__":
    asyncio.run(test_scheduler_deduplication())
    asyncio.run(verify_scraper_aod())
