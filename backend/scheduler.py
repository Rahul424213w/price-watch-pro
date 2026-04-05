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
from buybox_change_detector import BuyBoxChangeDetector
from whatsapp_alert_hook import WhatsAppAlertHook

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
            
            # 1. Detect Buy Box Change first (location-specific)
            last_buybox = db.query(models.PriceHistory)\
                            .filter(
                                models.PriceHistory.asin == asin,
                                models.PriceHistory.pincode == pincode,
                                models.PriceHistory.is_buybox == True,
                            )\
                            .order_by(models.PriceHistory.timestamp.desc())\
                            .first()
            
            bb_changed = False
            old_bb_state = {"price": 0.0, "seller_name": ""}
            new_bb_state = {"price": float(details.get("current_price", 0)), "seller_name": details.get("buybox_seller", "")}

            if last_buybox:
                old_bb_state = {"price": float(last_buybox.price), "seller_name": last_buybox.seller_name}
                if last_buybox.seller_name != details['buybox_seller']:
                    bb_changed = True

            # -- WhatsApp Buy Box Alert Hook (Removed to prevent spam on refresh) --
            # Automated Buy Box notifications are now disabled per user directive.
            # Manual pulses can still be triggered from the matrix or alerts page.

            # 2. Record a full snapshot for this scrape-run.
            # Deduping individual seller rows makes the "latest snapshot" incomplete and breaks
            # seller-matrix correctness. If you need storage control, do it via retention/rollups.
            for s in details['sellers']:
                new_entry = models.PriceHistory(
                    asin=asin,
                    seller_name=s['name'],
                    price=s['price'],
                    pincode=pincode,
                    is_out_of_stock=details['is_out_of_stock'],
                    is_buybox=s['isBuyBox'],
                    is_fba=s['isFBA'],
                    timestamp=current_time,
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
                    last_oos = db.query(models.PriceHistory)\
                                 .filter(models.PriceHistory.asin == asin, models.PriceHistory.pincode == pincode)\
                                 .order_by(models.PriceHistory.timestamp.desc())\
                                 .offset(1).first()
                    if last_oos and last_oos.is_out_of_stock != details['is_out_of_stock']:
                        trigger_hit = True

                if trigger_hit:
                    alert.is_triggered = True
                    alert.triggered_at = current_time
                    
                    # AI SMART ALERT ENHANCEMENT
                    try:
                        alert_details = {
                            "title": details.get('title', asin),
                            "current_price": details.get('current_price'),
                            "buybox_seller": details.get('buybox_seller'),
                            "is_out_of_stock": details.get('is_out_of_stock')
                        }
                        ai_explanation = await ai_service.generate_smart_alert_explanation(
                            asin=asin,
                            trigger_type=alert.alert_type,
                            details=alert_details
                        )
                    except:
                        ai_explanation = "Manual intervention recommended for this price event."
                        alert_details = {"title": asin, "current_price": details.get('current_price'), "buybox_seller": details.get('buybox_seller')}

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
                    
                    # WhatsApp Smart Alert (Removed per user directive to prevent spam on refresh)
                    # Triggered sentinels now only dispatch via SMTP to ensure non-invasive monitoring.

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
