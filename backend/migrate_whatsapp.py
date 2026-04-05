"""
WhatsApp Subscription Migration — PriceWatch Pro Plugin
========================================================
Creates the whatsapp_subscriptions table without touching any existing table.

Run once:
    cd backend
    python migrate_whatsapp.py

Safe to re-run (checkfirst=True prevents errors if table already exists).
"""

import sys
import os

# Make sure we can resolve local imports when run from the backend directory
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, Base
from whatsapp_subscription_model import WhatsAppSubscription  # noqa: F401 — registers model

if __name__ == "__main__":
    print("Running WhatsApp subscription migration...")
    # checkfirst=True → skip if table already exists (idempotent)
    WhatsAppSubscription.__table__.create(bind=engine, checkfirst=True)
    print("✅  Table 'whatsapp_subscriptions' created (or already exists).")
    print("Migration complete. No existing tables were changed.")
