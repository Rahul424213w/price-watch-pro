from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import asyncio
import random
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from database import SessionLocal
import models
import scraper
from ai_service import ai_service

def send_alert_email(subject, body):
    """Utility to send security-hardened SMTP alert notifications"""
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("ALERT_EMAIL_SENDER")
    recipient = os.getenv("ALERT_EMAIL_RECIPIENT")

    if not all([smtp_server, smtp_user, smtp_password, recipient]):
        print("[SMTP] Configuration missing, skipping email.")
        return

    msg = MIMEMultipart()
    msg['From'] = sender
    msg['To'] = recipient
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            print(f"[SMTP] Alert dispatched to {recipient}")
    except Exception as e:
        print(f"[SMTP Error] Failed to send alert: {e}")

scheduler = AsyncIOScheduler()
# Semaphore to limit concurrent scrapes (Higher concurrency for faster batch updates)
scrape_semaphore = asyncio.Semaphore(10)

async def scrape_and_update(asin: str, pincode: str = "110001"):
    """Single asset update worker with concurrency control"""
    async with scrape_semaphore:
        db = SessionLocal()
        try:
            print(f"[Scheduler] Processing {asin}...")
            details = await scraper.get_product_details(asin, pincode)
            if not details:
                return

            current_time = datetime.now(timezone.utc)
            
            # 1. Detect Buy Box Change first (for alerts)
            last_buybox = db.query(models.PriceHistory)\
                            .filter(models.PriceHistory.asin == asin, models.PriceHistory.is_buybox == True)\
                            .order_by(models.PriceHistory.timestamp.desc())\
                            .first()
            
            bb_changed = False
            if last_buybox and last_buybox.seller_name != details['buybox_seller']:
                bb_changed = True

            # 2. Add price points with Deduplication
            for s in details['sellers']:
                last_entry = db.query(models.PriceHistory)\
                               .filter(models.PriceHistory.asin == asin, models.PriceHistory.seller_name == s['name'])\
                               .order_by(models.PriceHistory.timestamp.desc())\
                               .first()
                
                should_record = True
                if last_entry:
                    # Skip flat lines (no price change) only within a very short window (15 mins)
                    # This ensures we have a dense history without massive storage bloat
                    last_ts = last_entry.timestamp.replace(tzinfo=timezone.utc) if (last_entry.timestamp and last_entry.timestamp.tzinfo is None) else last_entry.timestamp
                    is_recent = last_ts and (current_time - last_ts) < timedelta(minutes=15)
                    
                    if is_same_price and is_same_oos and is_recent:
                        should_record = False
                        
                if should_record:
                    new_entry = models.PriceHistory(
                        asin=asin,
                        seller_name=s['name'],
                        price=s['price'],
                        pincode=pincode,
                        is_out_of_stock=details['is_out_of_stock'],
                        is_buybox=s['isBuyBox'],
                        is_fba=s['isFBA'],
                        timestamp=current_time
                    )
                    db.add(new_entry)

            # 3. Handle Alerts
            active_alerts = db.query(models.Alert).filter(models.Alert.asin == asin, models.Alert.is_triggered == False).all()
            for alert in active_alerts:
                trigger_hit = False
                
                if alert.alert_type == "price_drop" and alert.target_price:
                    min_price = min([s['price'] for s in details['sellers']] + [details['current_price']])
                    if min_price <= alert.target_price and min_price > 0:
                        trigger_hit = True
                
                elif alert.alert_type == "buybox_change" and bb_changed:
                    trigger_hit = True
                
                elif alert.alert_type == "stock_change":
                    last_oos = db.query(models.PriceHistory).filter(models.PriceHistory.asin == asin).order_by(models.PriceHistory.timestamp.desc()).offset(1).first()
                    if last_oos and last_oos.is_out_of_stock != details['is_out_of_stock']:
                        trigger_hit = True

                if trigger_hit:
                    alert.is_triggered = True
                    alert.triggered_at = current_time
                    
                    # AI SMART ALERT ENHANCEMENT
                    try:
                        ai_explanation = await ai_service.generate_smart_alert_explanation(
                            asin=asin,
                            trigger_type=alert.alert_type,
                            details={"price": details.get('current_price'), "seller": details.get('buybox_seller')}
                        )
                    except:
                        ai_explanation = "Manual intervention recommended for this price event."

                    print(f"[ALERT] Triggered {alert.alert_type} for {asin}. AI Insight: {ai_explanation}")
                    
                    # DISPATCH EMAIL
                    subject = f"🚨 PriceWatch Alert: {alert.alert_type.upper()} for {asin}"
                    body = f"""
PriceWatch Pro - Strategic Intelligence Alert
=============================================
Product Title: {details['title']}
ASIN: {asin}
Alert Type: {alert.alert_type}
Target Price: ₹{alert.target_price if alert.target_price else 'N/A'}

AI SMART INSIGHT:
{ai_explanation}

Current Status: ₹{details['current_price']} | Buy Box: {details['buybox_seller']}
Time: {current_time.strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
                    send_alert_email(subject, body)

            db.commit()
            # Intelligent jitter to avoid pattern detection
            await asyncio.sleep(random.uniform(2, 5))
            
        except Exception as e:
            print(f"[Scheduler Error] {asin}: {e}")
            db.rollback()
        finally:
            db.close()

async def update_all_prices(pincode: str = "110001"):
    """entry point for periodic batch update or manual trigger"""
    db = SessionLocal()
    try:
        products = db.query(models.Product).filter(models.Product.is_active == True).all()
        if not products:
            return
            
        print(f"[Scheduler] Starting batch update for {len(products)} products at {pincode}.")
        tasks = [scrape_and_update(p.asin, pincode) for p in products]
        await asyncio.gather(*tasks)
        print("[Scheduler] Batch update completed.")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        # Production frequency: 30 minutes for higher resolution
        scheduler.add_job(update_all_prices, 'interval', minutes=30, id='price_update_job', replace_existing=True)
        scheduler.start()
        print("APScheduler Service Initialized (30m interval)")
