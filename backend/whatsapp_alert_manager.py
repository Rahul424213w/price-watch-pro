"""
WhatsApp Alert Manager — PriceWatch Pro Plugin
===============================================
Orchestrates per-product WhatsApp alert delivery.

Responsibilities:
  1. Fetch all active subscriptions for a product from the DB
  2. Format "Buy Box Changed" message from template
  3. Delegate sending to the centralized WhatsAppService
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from database import SessionLocal
from whatsapp_subscription_model import WhatsAppSubscription

logger = logging.getLogger("pricewatch.whatsapp_alert_manager")
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("[%(name)s] %(levelname)s: %(message)s"))
    logger.addHandler(_h)
logger.setLevel(logging.INFO)


# ── Message Template ───────────────────────────────────────────────────────────

_TEMPLATE = """\
🚨 *Buy Box Alert — PriceWatch Pro*

📦 Product: {product_name}
🔑 ASIN: {product_id}

💰 Previous Price: ₹{old_price}
🆕 New Price:      ₹{new_price}
🏆 Buy Box Seller: {seller_name}

⏰ {timestamp}
⚡ _Powered by PriceWatch Pro_"""


def _format_message(
    product_id: str,
    product_name: str,
    old_state: dict,
    new_state: dict,
) -> str:
    """Render the WhatsApp alert message from the template."""
    old_price    = f"{float(old_state.get('price', 0)):.2f}"
    new_price    = f"{float(new_state.get('price', 0)):.2f}"
    seller_name  = new_state.get("seller_name", "Unknown")
    timestamp    = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    return _TEMPLATE.format(
        product_name=product_name[:80],
        product_id=product_id,
        old_price=old_price,
        new_price=new_price,
        seller_name=seller_name,
        timestamp=timestamp,
    )


# ── Core Manager ───────────────────────────────────────────────────────────────

class WhatsAppAlertManager:
    """
    Sends Buy Box change alerts to all subscribers of a product.
    Used exclusively by WhatsAppAlertHook — callers should prefer that.
    """

    async def send_alerts_for_product(
        self,
        product_id: str,
        old_state: dict,
        new_state: dict,
        product_name: Optional[str] = None,
    ) -> None:
        """
        Fetches active subscriptions for product_id and sends WhatsApp messages.
        Never raises exceptions — all errors are logged.
        """
        if os.getenv("WHATSAPP_ALERTS_ENABLED", "false").lower() != "true":
            logger.debug("WhatsApp alerts disabled. Skipping.")
            return

        pname = product_name or product_id
        message = _format_message(product_id, pname, old_state, new_state)

        db = SessionLocal()
        subscribers = []
        try:
            subscribers = (
                db.query(WhatsAppSubscription)
                .filter(
                    WhatsAppSubscription.product_id == product_id,
                    WhatsAppSubscription.is_active == True,
                )
                .all()
            )
        except Exception as e:
            logger.error(f"DB query for subscriptions failed: {e}")
        finally:
            db.close()

        # ── Global Fallback Dispatch ───────────────────────────────────────────
        # In addition to specific subscribers, also notify the global admin number
        global_to = os.getenv("WHATSAPP_TO_NUMBER", "").strip()
        
        # Consolidate all recipients (subscribers + global admin)
        recipients = {sub.whatsapp_number for sub in subscribers}
        if global_to:
            recipients.add(global_to)

        if not recipients:
            logger.debug(f"No recipients (subscribers or global) for {product_id}")
            return

        logger.info(
            f"Dispatching Buy Box alert for {product_id} "
            f"to {len(recipients)} total recipient(s)."
        )

        # Import here to avoid circular imports
        from whatsapp_service import whatsapp_service
        for target in recipients:
            await whatsapp_service.send_message(message, to=target)


# ── Module-level singleton ─────────────────────────────────────────────────────
whatsapp_alert_manager = WhatsAppAlertManager()
