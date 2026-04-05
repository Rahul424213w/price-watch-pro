"""
WhatsApp Subscription Model — PriceWatch Pro Plugin
====================================================
New SQLAlchemy model for whatsapp_subscriptions table.
Imported by migrate_whatsapp.py and whatsapp_alert_manager.py.

This file does NOT modify or import from models.py.
It uses the same shared Base from database.py.
"""

import re
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from database import Base


# E.164 pattern: + followed by 7-15 digits
_E164_RE = re.compile(r"^\+[1-9]\d{6,14}$")


def is_valid_e164(number: str) -> bool:
    """Return True if number is a valid E.164 WhatsApp number."""
    return bool(_E164_RE.match(number or ""))


class WhatsAppSubscription(Base):
    """
    Stores seller WhatsApp numbers subscribed to Buy Box alerts
    for a specific product (ASIN).
    """
    __tablename__ = "whatsapp_subscriptions"

    id              = Column(Integer, primary_key=True, index=True)
    product_id      = Column(String, index=True, nullable=False)       # ASIN
    whatsapp_number = Column(String(25), nullable=False)               # E.164
    label           = Column(String(100), nullable=True)               # Optional display name
    is_active       = Column(Boolean, default=True, nullable=False)
    created_at      = Column(DateTime, default=func.now(), nullable=False)
    updated_at      = Column(DateTime, default=func.now(), onupdate=func.now())
