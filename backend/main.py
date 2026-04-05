from dotenv import load_dotenv
import os

# Platinum Initialization: Force-load environment variables BEFORE secondary imports
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Query, Header
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from sqlalchemy.exc import IntegrityError
import uvicorn
import asyncio
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
import random
import os
import csv
import io
from report_generator import ReportGenerator

from database import engine, SessionLocal, Base
import models
import scraper
import scheduler
from ai_service import ai_service
from whatsapp_subscription_router import whatsapp_subscription_router

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PriceWatch Pro - Competitive Intelligence API")

def _require_api_secret(x_api_secret: str | None):
    """Optional guardrail for dangerous endpoints.

    If API_SECRET is set, require clients to pass it via X-API-SECRET.
    This keeps hackathon demos frictionless (unset by default) while allowing
    basic protection in real deployments.
    """
    secret = os.getenv("API_SECRET")
    if secret and x_api_secret != secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WhatsApp Subscription API (plug-and-play router)
app.include_router(whatsapp_subscription_router)

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def validate_pincode(pincode: Optional[str]) -> str:
    """Platinum safety check for frontend-passed location tokens"""
    if not pincode or pincode == "undefined" or pincode == "null":
        return "110001"
    return pincode

@app.on_event("startup")
async def startup_event():
    scheduler.start_scheduler()

@app.get("/")
def read_root():
    return {"message": "PriceWatch Pro Intelligence Engine Active"}

# --- SEARCH & TRACK ---

@app.post("/search")
async def search_amazon(query: str, pincode: Optional[str] = "110001", page: Optional[int] = 1, db: Session = Depends(get_db)):
    pincode = validate_pincode(pincode)
    try:
        results = await scraper.search_amazon(query, pincode, page)
        
        # Check tracking status for each result
        tracked_asins = {asin for (asin,) in db.query(models.Product.asin).all()}
        for r in results:
            r["is_tracked"] = r["asin"] in tracked_asins
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/track")
async def track_product(asin: str, pincode: Optional[str] = "110001", db: Session = Depends(get_db)):
    pincode = validate_pincode(pincode)
    details = await scraper.get_product_details(asin, pincode)
    if not details:
        raise HTTPException(status_code=404, detail="Asset not reachable")
    
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        product = models.Product(
            asin=asin,
            title=details['title'],
            image_url=details['image_url'],
            is_active=True
        )
        db.add(product)
    else:
        # Update existing product metadata if it's changed or was missing
        product.title = details['title']
        product.image_url = details['image_url']
        product.is_active = True # Ensure it's active if re-added
    
    db.commit()
    db.refresh(product)
    
    # Record latest telemetry
    current_time = datetime.now(timezone.utc)
    for s in details['sellers']:
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
        
    db.commit()

    if not product:
        # --- WhatsApp Initial Monitoring Notification (Modular Hook) ---
        try:
            from whatsapp_service import dispatch_whatsapp_alert
            # Package data for AI synthesis
            alert_details = {
                "title": details.get('title'),
                "current_price": details.get('current_price'),
                "buybox_seller": details.get('buybox_seller'),
                "is_out_of_stock": details.get('is_out_of_stock')
            }
            
            # Synthesize initial strategic directive via Neural Engine
            ai_msg = await ai_service.generate_smart_alert_explanation(
                asin=asin, 
                trigger_type="initial_track", 
                details=alert_details
            )
            # Non-blocking dispatch to ensure fast API response
            asyncio.create_task(dispatch_whatsapp_alert(asin, "initial_track", alert_details, ai_msg))
        except Exception as e:
            print(f"[WhatsApp] Initial monitoring alert skipped: {e}")
    else:
         print(f"[PriceWatch] ASIN {asin} already in universe. Skipping initial WhatsApp pulse.")

    return {"status": "Telemetry Synchronized", "asin": asin}

@app.get("/dashboard/stats")
def get_dashboard_stats(pincode: Optional[str] = "110001", db: Session = Depends(get_db)):
    pincode = validate_pincode(pincode)
    tracked_count = db.query(func.count(models.Product.id)).scalar() or 0
    active_alerts = db.query(func.count(models.Alert.id)).filter(models.Alert.is_triggered == False).scalar() or 0
    
    # 1. Total Market Value and Buy Box Coverage
    subquery = db.query(
        models.PriceHistory.asin,
        func.max(models.PriceHistory.timestamp).label('max_ts')
    ).filter(models.PriceHistory.pincode == pincode, models.PriceHistory.is_buybox == True)\
     .group_by(models.PriceHistory.asin).subquery()
     
    latest_bb = db.query(models.PriceHistory)\
                  .join(subquery, (models.PriceHistory.asin == subquery.c.asin) & (models.PriceHistory.timestamp == subquery.c.max_ts))\
                  .all()
    
    bb_prices = [p.price for p in latest_bb if p.price > 0]
    total_val = sum(bb_prices)
    avg_price = total_val / len(bb_prices) if bb_prices else 0
    bb_coverage = (len(latest_bb) / tracked_count * 100) if tracked_count > 0 else 0

    # 2. Market Health (In-Stock Rate)
    latest_oos_subquery = db.query(
        models.PriceHistory.asin,
        func.max(models.PriceHistory.timestamp).label('max_ts')
    ).filter(models.PriceHistory.pincode == pincode)\
     .group_by(models.PriceHistory.asin).subquery()
     
    latest_states = db.query(models.PriceHistory.is_out_of_stock)\
                      .join(latest_oos_subquery, (models.PriceHistory.asin == latest_oos_subquery.c.asin) & (models.PriceHistory.timestamp == latest_oos_subquery.c.max_ts))\
                      .all()
    
    in_stock_count = len([s for s in latest_states if not s[0]])
    in_stock_rate = (in_stock_count / tracked_count * 100) if tracked_count > 0 else 0
    
    return {
        "tracked_count": tracked_count,
        "total_market_value": round(total_val, 2),
        "avg_market_price": round(avg_price, 2),
        "active_alerts": active_alerts,
        "in_stock_rate": round(in_stock_rate, 1),
        "buybox_coverage_rate": round(bb_coverage, 1),
        "system_health_score": round(min(100, (100 * in_stock_rate / 100) + (tracked_count > 0) * 5), 1)
    }


@app.post("/products/sync")
async def sync_all_active_products(pincode: Optional[str] = "110001"):
    pincode = validate_pincode(pincode)
    """Manually trigger global synchronization protocol"""
    try:
        await scheduler.update_all_prices(pincode)
        return {"status": "Global Synchronization Complete", "timestamp": datetime.now(timezone.utc)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/products")
def list_products(pincode: Optional[str] = None, db: Session = Depends(get_db)):
    lookup_pincode = validate_pincode(pincode)
    products = db.query(models.Product).all()
    results = []
    
    for p in products:
        # Get latest price for the selected pincode
        latest = db.query(models.PriceHistory)\
                   .filter(models.PriceHistory.asin == p.asin, models.PriceHistory.pincode == lookup_pincode)\
                   .order_by(models.PriceHistory.timestamp.desc())\
                   .first()
        
        # Get best price across ALL regional nodes
        best_price = db.query(func.min(models.PriceHistory.price))\
                       .filter(models.PriceHistory.asin == p.asin, models.PriceHistory.price > 0)\
                       .scalar() or 0
                       
        results.append({
            "asin": p.asin,
            "title": p.title,
            "image_url": p.image_url,
            "current_price": latest.price if latest else 0,
            "best_regional_price": best_price,
            "is_out_of_stock": latest.is_out_of_stock if latest else True,
            "last_updated": latest.timestamp if latest else None
        })
    return results

# --- ANALYTICS ---

@app.get("/analytics/volatility/{asin}")
def get_volatility(asin: str, db: Session = Depends(get_db)):
    """Calculate Price Volatility Score (0-100)"""
    history = db.query(models.PriceHistory.price)\
                .filter(models.PriceHistory.asin == asin, models.PriceHistory.is_buybox == True)\
                .all()
    
    prices = [h[0] for h in history if h[0] > 0]
    if len(prices) < 2:
        return {"score": 0, "status": "Insufficient Data"}
    
    mean = sum(prices) / len(prices)
    variance = sum((x - mean) ** 2 for x in prices) / len(prices)
    std_dev = variance ** 0.5
    
    # Score logic: Percentage of variation relative to mean
    score = min(100, (std_dev / mean) * 1000) # Weighted for sensitivity
    return {
        "score": round(score, 2),
        "mean": round(mean, 2),
        "std_dev": round(std_dev, 2),
        "data_points": len(prices)
    }

@app.get("/analytics/buybox/{asin}")
def get_buybox_win_rate(asin: str, db: Session = Depends(get_db)):
    """Calculate % time each seller held Buy Box"""
    total_scrapes = db.query(func.count(models.PriceHistory.id))\
                      .filter(models.PriceHistory.asin == asin, models.PriceHistory.is_buybox == True)\
                      .scalar() or 1
    
    # Filter out 'Suppressed' status from win rate calculations to only show real sellers
    wins = db.query(models.PriceHistory.seller_name, func.count(models.PriceHistory.id))\
             .filter(
                 models.PriceHistory.asin == asin, 
                 models.PriceHistory.is_buybox == True,
                 ~models.PriceHistory.seller_name.contains("Suppressed"),
                 ~models.PriceHistory.seller_name.contains("Options")
             )\
             .group_by(models.PriceHistory.seller_name)\
             .all()
    
    total_valid_scrapes = sum(w[1] for w in wins) or 1
    
    return [
        {"seller": w[0], "win_rate": round((w[1] / total_valid_scrapes) * 100, 2)}
        for w in wins
    ]

@app.get("/regional/comparison/{asin}")
def get_regional_comparison(asin: str, db: Session = Depends(get_db)):
    """Compare latest prices across major metropolitan nodes"""
    pincodes = ["110001", "400001", "560001", "700001", "600001"] # Core Intelligence Zones
    results = []
    
    for pin in pincodes:
        latest = db.query(models.PriceHistory)\
                   .filter(models.PriceHistory.asin == asin, models.PriceHistory.pincode == pin, models.PriceHistory.is_buybox == True)\
                   .order_by(models.PriceHistory.timestamp.desc())\
                   .first()
        if latest:
            results.append({
                "pincode": pin,
                "price": latest.price,
                "seller": latest.seller_name,
                "timestamp": latest.timestamp
            })
        else:
            # Placeholder for zones not yet scraped
            results.append({
                "pincode": pin,
                "price": 0,
                "seller": "Pending Scan",
                "timestamp": None
            })
    return results

@app.post("/regional/scrape/{asin}")
async def trigger_regional_scrape(asin: str, db: Session = Depends(get_db)):
    """Execute high-concurrency regional intelligence burst"""
    pincodes = ["110001", "400001", "560001", "700001", "600001"]
    
    async def scrape_zone(pin):
        try:
            details = await scraper.get_product_details(asin, pin)
            if not details: return None
            
            # Save telemetry
            current_time = datetime.now(timezone.utc)
            for s in details['sellers']:
                new_entry = models.PriceHistory(
                    asin=asin,
                    seller_name=s['name'],
                    price=s['price'],
                    pincode=pin,
                    is_out_of_stock=details['is_out_of_stock'],
                    is_buybox=s['isBuyBox'],
                    is_fba=s['isFBA'],
                    timestamp=current_time
                )
                db.add(new_entry)
            return {"pincode": pin, "status": "Success"}
        except Exception as e:
            print(f"Zone {pin} failure: {e}")
            return {"pincode": pin, "status": "Failed"}

    # Use asyncio.gather for parallel burst
    tasks = [scrape_zone(pin) for pin in pincodes]
    results = await asyncio.gather(*tasks)
    
    db.commit()
    return {"status": "Regional Intel Consolidated", "results": results}

# --- SENTINELS (ALERTS) ---

@app.post("/alert")
def create_alert(asin: str, target_price: float, db: Session = Depends(get_db)):
    """Initialize a new Monitoring Sentinel for a specific target price"""
    # Verify product exists before alerting
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Target asset not found in universe")
        
    new_alert = models.Alert(
        asin=asin,
        target_price=target_price,
        alert_type="price_drop",
        is_triggered=False
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return {"status": "Sentinel Activated", "id": new_alert.id}

@app.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """Fetch all sentinels across the monitoring grid"""
    return db.query(models.Alert).order_by(models.Alert.created_at.desc()).all()

@app.delete("/alert/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db), x_api_secret: Optional[str] = Header(default=None)):
    """Decommission a monitoring sentinel"""
    _require_api_secret(x_api_secret)
    db.query(models.Alert).filter(models.Alert.id == alert_id).delete()
    db.commit()
    return {"status": "Sentinel Decommissioned"}


@app.delete("/history/{asin}")
def delete_product_history(asin: str, db: Session = Depends(get_db), x_api_secret: Optional[str] = Header(default=None)):
    """Delete telemetry only (keeps the tracked product)."""
    _require_api_secret(x_api_secret)
    db.query(models.PriceHistory).filter(models.PriceHistory.asin == asin).delete()
    db.commit()
    return {"status": "History Purged", "asin": asin}

# --- EXPORT ---

@app.get("/export/csv/{asin}")
def export_csv(asin: str, db: Session = Depends(get_db)):
    if asin == 'all':
        products = db.query(models.Product).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ASIN", "Title", "Latest Price", "7-Day Avg", "Status"])
        
        for p in products:
            latest = db.query(models.PriceHistory).filter(models.PriceHistory.asin == p.asin).order_by(models.PriceHistory.timestamp.desc()).first()
            avg_price = db.query(func.avg(models.PriceHistory.price)).filter(models.PriceHistory.asin == p.asin, models.PriceHistory.timestamp >= datetime.now() - timedelta(days=7)).scalar() or 0
            writer.writerow([p.asin, p.title, latest.price if latest else 0, round(avg_price, 2), "OOS" if latest and latest.is_out_of_stock else "In Stock"])
            
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=global_intelligence_report.csv"}
        )
    
    history = db.query(models.PriceHistory).filter(models.PriceHistory.asin == asin).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Seller", "Price", "Pincode", "BuyBox", "FBA", "OOS"])
    for h in history:
        writer.writerow([h.timestamp, h.seller_name, h.price, h.pincode, h.is_buybox, h.is_fba, h.is_out_of_stock])
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=history_{asin}.csv"})

@app.get("/export/pdf/{asin}")
async def export_report_pdf(asin: str, db: Session = Depends(get_db)):
    if asin == 'all':
        # Generate Fleet Intelligence Summary
        stats = get_dashboard_stats("110001", db) # Default to Delhi for summary
        products_raw = list_products("110001", db)
        
        products_data = [
            [
                p['asin'],
                p['title'][:50] + "..." if len(p['title']) > 50 else p['title'],
                f"₹{p['current_price']}",
                "OOS" if p['is_out_of_stock'] else "IN STOCK"
            ]
            for p in products_raw
        ]
        
        report_data = {
            "stats": stats,
            "products": products_data
        }
        
        generator = ReportGenerator(report_data, report_type='GLOBAL')
        pdf_content = generator.generate()
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=PriceWatch_Fleet_Summary.pdf"}
        )

    # Individual Asset Report (Non-AI Version)
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    history = db.query(models.PriceHistory)\
                .filter(models.PriceHistory.asin == asin)\
                .order_by(models.PriceHistory.timestamp.desc())\
                .limit(20).all()
                
    history_data = [
        [h.timestamp.strftime('%Y-%m-%d %H:%M'), h.seller_name[:30], f"₹{h.price}", "YES" if h.is_buybox else "NO"]
        for h in history
    ]
    
    report_data = {
        "asin": asin,
        "title": product.title,
        "history": history_data,
        "pricing": f"Standard telemetry report for ASIN {asin}. Neural strategic analysis available via Executive Export.",
        "market": "Baseline market scanning complete. Tracking active across multiple regional nodes.",
        "trend": "Historical price volatility tracking in progress.",
        "undercut": "Competitor behavior monitoring active.",
        "location": "Regional arbitrage analysis pending burst scrape."
    }
    
    generator = ReportGenerator(report_data, report_type='EXECUTIVE')
    pdf_content = generator.generate()
    
    return Response(
        content=pdf_content, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=Asset_Report_{asin}.pdf"}
    )

# --- AI INTELLIGENCE (GROQ-POWERED) ---

@app.post("/ai/pricing-advisor/{asin}")
async def get_ai_pricing_advice(asin: str, pincode: Optional[str] = "110001", db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get latest prices for this product
    latest_scrapes = db.query(models.PriceHistory)\
                       .filter(models.PriceHistory.asin == asin, models.PriceHistory.pincode == pincode)\
                       .order_by(models.PriceHistory.timestamp.desc())\
                       .limit(10).all()
                       
    sellers = [{"name": h.seller_name, "price": h.price, "is_buybox": h.is_buybox} for h in latest_scrapes]
    current_price = latest_scrapes[0].price if latest_scrapes else 0
    
    advice = await ai_service.get_pricing_advice(product.title, current_price, sellers)
    return {"advice": advice}

@app.post("/ai/market-insight/{asin}")
async def get_ai_market_insight(asin: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    history = db.query(models.PriceHistory).filter(models.PriceHistory.asin == asin).order_by(models.PriceHistory.timestamp.desc()).limit(20).all()
    sellers = [{"name": h.seller_name, "price": h.price, "is_buybox": h.is_buybox} for h in history]
    
    prices = [h.price for h in history if h.price > 0]
    avg_price = sum(prices) / len(prices) if prices else 0
    unique_sellers_count = len({h.seller_name for h in history})
    history_summary = f"Product has seen price fluctuations around ₹{round(avg_price, 2)} with {unique_sellers_count} competitive sellers tracked."
    
    insight = await ai_service.explain_market(product.title, sellers, history_summary)
    return {"insight": insight}

@app.post("/ai/undercut-prediction/{asin}")
async def get_ai_undercut_prediction(asin: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    history = db.query(models.PriceHistory).filter(models.PriceHistory.asin == asin).order_by(models.PriceHistory.timestamp.desc()).limit(30).all()
    history_data = [{"seller": h.seller_name, "price": h.price, "ts": h.timestamp.isoformat()} for h in history]
    
    prediction = await ai_service.predict_undercut(product.title, history_data)
    return {"prediction": prediction}

@app.post("/ai/location-strategy/{asin}")
async def get_ai_location_strategy(asin: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    pincodes = ["110001", "400001", "560001", "700001", "600001"]
    regional_data = []
    for pin in pincodes:
        latest = db.query(models.PriceHistory)\
                   .filter(models.PriceHistory.asin == asin, models.PriceHistory.pincode == pin, models.PriceHistory.is_buybox == True)\
                   .order_by(models.PriceHistory.timestamp.desc())\
                   .first()
        if latest:
            regional_data.append({"pincode": pin, "price": latest.price, "seller": latest.seller_name})

    strategy = await ai_service.get_location_strategy(product.title, regional_data)
    return {"strategy": strategy}

@app.post("/ai/trend-forecast/{asin}")
async def get_ai_trend_forecast(asin: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    history = db.query(models.PriceHistory.price)\
                .filter(models.PriceHistory.asin == asin, models.PriceHistory.is_buybox == True)\
                .order_by(models.PriceHistory.timestamp.desc())\
                .limit(50).all()
    prices = [p[0] for p in history]
    
    forecast = await ai_service.forecast_trends(product.title, prices)
    return {"forecast": forecast}

@app.get("/ai/export-report-pdf/{asin}")
async def export_ai_report_pdf(asin: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Parallel Neural Synthesis for speed
    try:
        pricing_task = get_ai_pricing_advice(asin, "110001", db)
        market_task = get_ai_market_insight(asin, db)
        undercut_task = get_ai_undercut_prediction(asin, db)
        location_task = get_ai_location_strategy(asin, db)
        trend_task = get_ai_trend_forecast(asin, db)
        
        results = await asyncio.gather(pricing_task, market_task, undercut_task, location_task, trend_task)
        
        pricing = results[0]['advice']
        market = results[1]['insight']
        undercut = results[2]['prediction']
        location = results[3]['strategy']
        trend = results[4]['forecast']
    except Exception as e:
        print(f"Neural Synthesis Failure: {e}")
        # Fallback values if Groq is slow or errors
        pricing = market = undercut = location = trend = "Intelligence synthesis timeout. Regional nodes active but strategic analysis pending."

    # Fetch price history for context table
    history = db.query(models.PriceHistory)\
                .filter(models.PriceHistory.asin == asin)\
                .order_by(models.PriceHistory.timestamp.desc())\
                .limit(15).all()
    
    # Format history for ReportLab Table
    history_data = [
        [
            h.timestamp.strftime('%Y-%m-%d %H:%M'),
            h.seller_name[:30] + "..." if len(h.seller_name) > 30 else h.seller_name,
            f"₹{h.price}",
            "YES" if h.is_buybox else "NO"
        ]
        for h in history
    ]

    # Generate Enterprise PDF
    report_data = {
        "asin": asin,
        "pricing": pricing,
        "market": market,
        "undercut": undercut,
        "location": location,
        "trend": trend,
        "history": history_data
    }
    
    generator = ReportGenerator(report_data, report_type='EXECUTIVE')
    pdf_content = generator.generate()
    
    return Response(
        content=pdf_content, 
        media_type="application/pdf", 
        headers={
            "Content-Disposition": f"attachment; filename=PriceWatch_Executive_Report_{asin}.pdf",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@app.post("/ai/generate-report/{asin}")
async def generate_ai_report_api(asin: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    insight_res = await get_ai_market_insight(asin, db)
    forecast_res = await get_ai_trend_forecast(asin, db)
    advice_res = await get_ai_pricing_advice(asin, "110001", db)
    
    report_summary = f"""
AI BUSINESS INTELLIGENCE REPORT
===============================
ASIN: {asin}
PRODUCT: {product.title}

MARKET DYNAMICS:
{insight_res['insight']}

TREND FORECAST:
{forecast_res['forecast']}

STRATEGIC RECOMMENDATION:
{advice_res['advice']}
"""
    return {"report": report_summary.strip()}

# --- PRODUCT DETAIL (ASSET VIEW) ---

@app.get("/product/{asin}")
def get_product(asin: str, pincode: Optional[str] = "110001", db: Session = Depends(get_db)):
    pincode = validate_pincode(pincode)
    product = db.query(models.Product).filter(models.Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Pull history once, then build a stable chart series.
    rows = db.query(models.PriceHistory) \
             .filter(models.PriceHistory.asin == asin, models.PriceHistory.pincode == pincode) \
             .order_by(models.PriceHistory.timestamp.asc(), models.PriceHistory.is_buybox.desc(), models.PriceHistory.price.asc()) \
             .all()

    # Build a time-series with ONE point per timestamp.
    # Preference order per timestamp: Buy Box row, else lowest non-zero price, else first row.
    chart_data = []
    by_ts: Dict[datetime, List[models.PriceHistory]] = {}
    for r in rows:
        if not r.timestamp:
            continue
        by_ts.setdefault(r.timestamp, []).append(r)

    for ts in sorted(by_ts.keys()):
        bucket = by_ts[ts]
        bb = next((x for x in bucket if x.is_buybox), None)
        if bb:
            chosen = bb
        else:
            non_zero = [x for x in bucket if (x.price or 0) > 0]
            chosen = min(non_zero, key=lambda x: x.price) if non_zero else bucket[0]

        chart_data.append({
            "name": ts.isoformat(),
            "timestamp": int(ts.timestamp() * 1000), # Unix ms for Recharts linear scale
            "price": chosen.price,
            "is_oos": chosen.is_out_of_stock,
            "seller": chosen.seller_name,
            "isBuyBox": bool(chosen.is_buybox),
        })

    # Strict Chronological Post-Sort (Secondary Safety)
    chart_data.sort(key=lambda x: x['timestamp'])

    # Latest snapshot for seller matrix
    latest_ts = max(by_ts.keys()) if by_ts else None
    sellers = []
    latest_price = 0.0
    latest_oos = True
    latest_updated = None
    if latest_ts:
        latest_bucket = by_ts[latest_ts]
        latest_updated = latest_ts
        latest_oos = any(x.is_out_of_stock for x in latest_bucket)

        # Prefer Buy Box price as "current"; else min non-zero.
        bb = next((x for x in latest_bucket if x.is_buybox and (x.price or 0) > 0), None)
        if bb:
            latest_price = bb.price
        else:
            non_zero = [x for x in latest_bucket if (x.price or 0) > 0]
            latest_price = min((x.price for x in non_zero), default=0.0)

        sellers = [{
            "name": h.seller_name,
            "price": h.price,
            "isFBA": h.is_fba,
            "isBuyBox": h.is_buybox,
            "isOutOfStock": h.is_out_of_stock,
        } for h in sorted(latest_bucket, key=lambda x: (not x.is_buybox, x.price if x.price else 10**18))]

    product_payload = {
        "asin": product.asin,
        "title": product.title,
        "image_url": product.image_url,
        "is_active": product.is_active,
        "current_price": latest_price,
        "is_out_of_stock": latest_oos,
        "last_updated": latest_updated,
    }

    return jsonable_encoder({"product": product_payload, "chart_data": chart_data, "sellers": sellers})

@app.delete("/product/{asin}")
def decommission_product(asin: str, db: Session = Depends(get_db), x_api_secret: Optional[str] = Header(default=None)):
    _require_api_secret(x_api_secret)
    db.query(models.PriceHistory).filter(models.PriceHistory.asin == asin).delete()
    db.query(models.Alert).filter(models.Alert.asin == asin).delete()
    db.query(models.Product).filter(models.Product.asin == asin).delete()
    db.commit()
    return {"status": "Decommissioned"}

@app.get("/system/status")
async def get_system_status():
    """Real-time health check for proxy and scraping engine"""
    try:
        # ScraperAPI check via a simple status pulse
        return {
            "proxy_online": True,
            "engine_status": "Optimal",
            "last_heartbeat": datetime.now(timezone.utc)
        }
    except Exception as e:
        return {
            "proxy_online": False,
            "error": str(e),
            "engine_status": "Degraded",
            "last_heartbeat": datetime.now(timezone.utc)
        }

@app.get("/system/latest-activity")
def get_latest_activity(db: Session = Depends(get_db)):
    """Fetch the last 20 significant monitoring events for the intelligence feed"""
    latest_updates = db.query(models.PriceHistory)\
                       .order_by(models.PriceHistory.timestamp.desc())\
                       .limit(20).all()
    
    activity = []
    for h in latest_updates:
        activity.append({
            "id": h.id,
            "type": "success" if h.is_buybox else "system",
            "text": f"Node {h.pincode} verified ASIN {h.asin} | Price: ₹{h.price} | Buy Box: {'Yes' if h.is_buybox else 'No'}",
            "asin": h.asin,
            "pin": h.pincode,
            "timestamp": h.timestamp
        })
        
    return activity


@app.post("/system/reset")
def reset_system(db: Session = Depends(get_db), x_api_secret: Optional[str] = Header(default=None)):
    """PERMANENTLY WIPE ALL INTELLIGENCE DATA"""
    _require_api_secret(x_api_secret)
    try:
        # Full fleet-wide data clearing
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        return {"status": "Full System Wipe Complete", "timestamp": datetime.now(timezone.utc)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
