"""
WhatsApp Subscription Router — PriceWatch Pro Plugin
=====================================================
FastAPI router for managing per-product WhatsApp alert subscriptions.

Endpoints:
    POST   /api/whatsapp/subscribe
    DELETE /api/whatsapp/unsubscribe/{id}
    GET    /api/whatsapp/subscriptions?product_id=XXX

Mount this in main.py with ONE line:
    app.include_router(whatsapp_subscription_router)

No other change to main.py is needed.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from database import SessionLocal
from whatsapp_subscription_model import WhatsAppSubscription, is_valid_e164

whatsapp_subscription_router = APIRouter(
    prefix="/api/whatsapp",
    tags=["WhatsApp Subscriptions"],
)


# ── DB Dependency (identical pattern to main.py's get_db) ─────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Pydantic Schemas ───────────────────────────────────────────────────────────

class SubscribeRequest(BaseModel):
    product_id:      str
    whatsapp_number: str
    label:           Optional[str] = None

    @validator("whatsapp_number")
    def validate_number(cls, v):
        if not is_valid_e164(v):
            raise ValueError(
                f"whatsapp_number must be E.164 format (e.g. +91XXXXXXXXXX). Got: {v!r}"
            )
        return v

    @validator("product_id")
    def validate_asin(cls, v):
        v = v.strip().upper()
        if not v:
            raise ValueError("product_id (ASIN) must not be empty.")
        return v


class SubscriptionOut(BaseModel):
    id:              int
    product_id:      str
    whatsapp_number: str
    label:           Optional[str]
    is_active:       bool
    created_at:      datetime

    class Config:
        from_attributes = True   # Pydantic v2 compat; v1 uses orm_mode = True
        orm_mode = True


# ── Endpoints ──────────────────────────────────────────────────────────────────

@whatsapp_subscription_router.post(
    "/subscribe",
    response_model=SubscriptionOut,
    summary="Subscribe a WhatsApp number to Buy Box alerts for a product",
)
def subscribe(req: SubscribeRequest, db: Session = Depends(get_db)):
    """
    Register a seller's WhatsApp number to receive Buy Box change alerts
    for a specific ASIN.

    - **product_id**: Amazon ASIN (e.g. B09XYZ1234)
    - **whatsapp_number**: E.164 format (e.g. +919876543210)
    - **label**: Optional name/note for this subscription
    """
    # Prevent duplicate active subscriptions for the same (ASIN, number) pair
    existing = (
        db.query(WhatsAppSubscription)
        .filter(
            WhatsAppSubscription.product_id == req.product_id,
            WhatsAppSubscription.whatsapp_number == req.whatsapp_number,
            WhatsAppSubscription.is_active == True,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"An active subscription already exists (id={existing.id}).",
        )

    sub = WhatsAppSubscription(
        product_id=req.product_id,
        whatsapp_number=req.whatsapp_number,
        label=req.label,
        is_active=True,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@whatsapp_subscription_router.delete(
    "/unsubscribe/{subscription_id}",
    summary="Unsubscribe (soft-delete) a WhatsApp alert subscription",
)
def unsubscribe(subscription_id: int, db: Session = Depends(get_db)):
    """
    Deactivates a subscription by ID.  Uses a soft-delete (is_active=False)
    to preserve historical records.
    """
    sub = db.query(WhatsAppSubscription).filter(
        WhatsAppSubscription.id == subscription_id
    ).first()

    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    sub.is_active = False
    sub.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "unsubscribed", "id": subscription_id}


@whatsapp_subscription_router.get(
    "/subscriptions",
    response_model=List[SubscriptionOut],
    summary="List active WhatsApp subscriptions, optionally filtered by product",
)
def list_subscriptions(
    product_id: Optional[str] = Query(None, description="Filter by ASIN"),
    db: Session = Depends(get_db),
):
    """
    Returns all active WhatsApp subscriptions.
    Optionally filter by **product_id** (ASIN).
    """
    query = db.query(WhatsAppSubscription).filter(
        WhatsAppSubscription.is_active == True
    )
    if product_id:
        query = query.filter(
            WhatsAppSubscription.product_id == product_id.strip().upper()
        )
    return query.order_by(WhatsAppSubscription.created_at.desc()).all()

@whatsapp_subscription_router.post(
    "/test-notification/{asin}",
    summary="Send a dummy WhatsApp notification for a specific product",
)
async def send_test_notification(asin: str, db: Session = Depends(get_db)):
    """
    Sends a high-impact dummy notification to the global WHATSAPP_TO_NUMBER.
    Used for demonstrating the WhatsApp alert system via the dashboard.
    """
    from models import Product, PriceHistory
    from whatsapp_service import whatsapp_service
    
    product = db.query(Product).filter(Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in universe")
        
    # Dummy data as requested by the user
    dummy_price = 639.00
    dummy_seller = "Strategic Partner Alpha"
    
    message = (
        f"🚨 *DEMO: Buy Box Alert — PriceWatch Pro*\n"
        f"\n"
        f"📦 Product: {product.title[:80]}...\n"
        f"🔑 ASIN: {asin}\n"
        f"\n"
        f"💰 Simulated Price: ₹{dummy_price}\n"
        f"🏆 Buy Box Seller: {dummy_seller}\n"
        f"\n"
        f"⚡ _This is a live test message from the Dashboard_"
    )
    
    success = await whatsapp_service.send_message(message)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to deliver WhatsApp message. Check Twilio config.")
        
    return {"status": "success", "message": "Test notification dispatched"}

@whatsapp_subscription_router.post(
    "/send-status/{asin}",
    summary="Send a quick status WhatsApp message for a specific product",
)
async def send_status(asin: str, db: Session = Depends(get_db)):
    """
    Dispatches a simplified real-time telemetry pulse to the primary WhatsApp recipient.
    """
    from models import Product, PriceHistory
    from whatsapp_service import whatsapp_service
    
    product = db.query(Product).filter(Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    latest = db.query(PriceHistory).filter(PriceHistory.asin == asin).order_by(PriceHistory.timestamp.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No telemetry found for this asset")
        
    message = (
        f"📦 *QUICK STATUS: {asin}*\n"
        f"————————————————\n"
        f"💰 Price: ₹{latest.price}\n"
        f"🏆 Buy Box: {latest.seller_name}\n"
        f"📉 Status: {'Out of Stock' if latest.is_out_of_stock else 'In Stock'}\n"
        f"\n"
        f"⚡ *STRATEGIC ACTION:* Review pricing matrix to maintain buybox dominance."
    )
    
    success = await whatsapp_service.send_message(message)
    if not success:
        raise HTTPException(status_code=500, detail="WhatsApp telemetry delivery failed. Verify Twilio configuration.")
        
    return {"status": "success", "asin": asin}

@whatsapp_subscription_router.post(
    "/send-analysis/{asin}",
    summary="Send a neural analysis report via WhatsApp",
)
async def send_analysis(asin: str, db: Session = Depends(get_db)):
    """
    Synthesizes current market intelligence and broadcasts a focused strategic directive.
    """
    from models import Product, PriceHistory
    from whatsapp_service import whatsapp_service
    from ai_service import ai_service
    
    product = db.query(Product).filter(Product.asin == asin).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    latest = db.query(PriceHistory).filter(PriceHistory.asin == asin, PriceHistory.is_buybox == True).order_by(PriceHistory.timestamp.desc()).first()
    current_price = latest.price if latest else 0.0
    
    # Generate concise advice for mobile
    advice = await ai_service.get_pricing_advice(product.title, current_price, [])
    
    message = (
        f"🧠 *NEURAL ANALYSIS: {asin}*\n"
        f"————————————————\n"
        f"📝 *STRATEGIC ADVICE:*\n"
        f"{advice[:250]}...\n"
        f"\n"
        f"🎯 *IMMEDIATE ACTION:* Force regional burst scrape to verify competitor stock levels."
    )
    
    success = await whatsapp_service.send_message(message)
    if not success:
        raise HTTPException(status_code=500, detail="Neural analysis delivery failed. Check Twilio auth settings.")
        
    return {"status": "success", "asin": asin}
