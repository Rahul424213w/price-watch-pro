"""
WhatsApp Alert Hook — PriceWatch Pro Plugin
===========================================
Single entry-point that can be called from the existing price-update
flow without modifying any surrounding logic.

Usage (inside scheduler.py after Buy Box data is detected):
    from whatsapp_alert_hook import WhatsAppAlertHook

    # old_state / new_state: {'price': float, 'seller_name': str}
    asyncio.create_task(
        WhatsAppAlertHook.trigger(product_id, old_state, new_state, product_name)
    )

This file NEVER raises an exception — all failures are silently logged.
"""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger("pricewatch.whatsapp_hook")
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("[%(name)s] %(levelname)s: %(message)s"))
    logger.addHandler(_h)
logger.setLevel(logging.INFO)


class WhatsAppAlertHook:
    """
    Thin static façade over WhatsAppAlertManager.
    Designed so callers only need one line to integrate:
        asyncio.create_task(WhatsAppAlertHook.trigger(...))
    """

    @staticmethod
    async def trigger(
        product_id: str,
        old_state: dict,
        new_state: dict,
        product_name: Optional[str] = None,
    ) -> None:
        """
        Fire-and-forget entry point.
        Catches every possible exception so the caller is never affected.
        """
        try:
            from whatsapp_alert_manager import whatsapp_alert_manager
            await whatsapp_alert_manager.send_alerts_for_product(
                product_id=product_id,
                old_state=old_state,
                new_state=new_state,
                product_name=product_name,
            )
        except Exception as exc:
            # Absolute last-resort catch — this method MUST NEVER propagate
            logger.error(
                f"[WhatsAppAlertHook] Unexpected error for {product_id}: {exc}"
            )
