"""
WhatsApp Smart Alert Service — PriceWatch Pro Plugin
=====================================================
Non-intrusive, fail-safe WhatsApp delivery layer for Sentinel Alerts.
Uses Twilio WhatsApp API via httpx (async HTTP).

This module is designed as a plug-and-play addition:
  - Reads its own config from environment variables
  - Silently no-ops when WHATSAPP_ENABLED != "true"
  - Never raises exceptions to the caller
  - All failures are logged, never propagated
"""

import os
import asyncio
import logging
from typing import Dict, Optional
from datetime import datetime, timezone
from dotenv import load_dotenv

# Ensure environment is loaded in standalone mode
load_dotenv()

# Lazy import — httpx is only needed if WhatsApp is enabled
_httpx = None

logger = logging.getLogger("pricewatch.whatsapp")
logger.setLevel(logging.INFO)

# Add console handler if none exists (standalone-friendly)
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("[%(name)s] %(levelname)s: %(message)s"))
    logger.addHandler(_handler)


class WhatsAppService:
    """Twilio WhatsApp API client with retry and fail-safe design."""

    def __init__(self):
        self.enabled = os.getenv("WHATSAPP_ENABLED", "false").lower() == "true"
        self.account_sid = os.getenv("WHATSAPP_ACCOUNT_SID", "").strip()
        self.auth_token = os.getenv("WHATSAPP_AUTH_TOKEN", "").strip()
        self.from_number = os.getenv("WHATSAPP_FROM_NUMBER", "whatsapp:+14155238886").strip()
        self.to_number = os.getenv("WHATSAPP_TO_NUMBER", "").strip()
        self.max_retries = 2

    @property
    def base_url(self) -> str:
        """Dynamic URL generator to handle potential SID updates"""
        account_sid = os.getenv("WHATSAPP_ACCOUNT_SID", self.account_sid)
        return f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"

    def is_configured(self) -> bool:
        """Check if all required credentials are present."""
        return bool(self.enabled and self.account_sid and self.auth_token and self.to_number)

    async def send_message(self, message: str, to: Optional[str] = None) -> bool:
        """
        Send a WhatsApp message via Twilio API.
        Returns True on success, False on failure.
        Never raises exceptions.
        """
        # Fallback to default if no specific recipient provided
        target_to = to or self.to_number
        
        # Validation: check for configuration AND a target number
        if not self.is_configured() and not (self.enabled and self.account_sid and self.auth_token and target_to):
            if self.enabled:
                logger.warning("WhatsApp enabled but credentials or recipient missing. Skipping.")
            return False

        # Prefix logic for WhatsApp numbers
        if not target_to.startswith("whatsapp:"):
            target_to = f"whatsapp:{target_to}"
        
        # Ensure from number has prefix too
        from_num = self.from_number
        if not from_num.startswith("whatsapp:"):
            from_num = f"whatsapp:{from_num}"

        global _httpx
        if _httpx is None:
            try:
                import httpx
                _httpx = httpx
            except ImportError:
                logger.error("httpx not installed. Run: pip install httpx")
                return False

        # Truncate to WhatsApp limit (4096 chars for business API)
        if len(message) > 4000:
            message = message[:3997] + "..."

        payload = {
            "From": from_num,
            "To": target_to,
            "Body": message,
        }

        for attempt in range(1, self.max_retries + 1):
            try:
                async with _httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(
                        self.base_url,
                        data=payload,
                        auth=(self.account_sid, self.auth_token),
                    )

                if response.status_code in (200, 201):
                    logger.info(f"WhatsApp alert sent successfully (attempt {attempt})")
                    return True

                # Detailed failure logs for user troubleshooting
                error_body = response.text
                if response.status_code == 401:
                    logger.error(f"[Twilio Auth] FAILED: Account SID or Auth Token is invalid. Check .env (attempt {attempt})")
                elif response.status_code == 404:
                    logger.error(f"[Twilio Route] FAILED: Account SID is wrong or not found in URI. (attempt {attempt})")
                else:
                    logger.warning(
                        f"Twilio returned {response.status_code} on attempt {attempt}: "
                        f"{error_body[:200]}"
                    )

            except Exception as e:
                logger.error(f"WhatsApp send failed (attempt {attempt}): {e}")

            # Exponential backoff before retry
            if attempt < self.max_retries:
                await asyncio.sleep(2 ** attempt)

        logger.error(f"WhatsApp delivery failed after {self.max_retries} attempts. Giving up.")
        return False


def format_alert_message(
    asin: str,
    alert_type: str,
    details: Dict,
    ai_explanation: str,
) -> str:
    """
    Build a mobile-friendly WhatsApp message from alert data.
    Reuses the same AI-generated Smart Insight from the existing pipeline.
    """
    # Map alert types to human-readable labels
    type_labels = {
        "price_drop": "💰 PRICE DROP",
        "buybox_change": "🏆 BUY BOX CHANGE",
        "stock_change": "📦 STOCK STATUS CHANGE",
        "new_seller": "🆕 NEW SELLER DETECTED",
    }
    alert_label = type_labels.get(alert_type, alert_type.upper())
    if alert_type == "initial_track":
        alert_label = "🛰️ NEW ASSET MONITORED"

    title = details.get("title") or details.get("product_name") or "Unknown Product"
    current_price = details.get("current_price") or details.get("price") or "N/A"
    buybox_seller = details.get("buybox_seller") or details.get("seller") or details.get("seller_name") or "Unknown"
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Initial track message has slightly different structure
    if alert_type == "initial_track":
        message = (
            f"🛰️ *PriceWatch: New Asset Optimized*\n"
            f"\n"
            f"✅ monitoring initialized for:\n"
            f"📦 ASIN: {asin}\n"
            f"📎 {title[:100]}\n"
            f"\n"
            f"📊 Initial Data:\n"
            f"💰 Price: ₹{current_price}\n"
            f"🏆 Buy Box: {buybox_seller or 'None'}\n"
            f"\n"
            f"🧠 *AI Strategy Initialized:*\n"
            f"{ai_explanation[:300]}\n"
            f"\n"
            f"🚀 _Real-time sentinel active for this asset._"
        )
        return message

    # Standard Alert message (same as before)
    message = (
        f"🚨 *PriceWatch Alert: {alert_label}*\n"
        f"\n"
        f"📦 ASIN: {asin}\n"
        f"📍 {title[:80]}\n"
        f"\n"
        f"💰 Current Price: ₹{current_price}\n"
        f"🏆 Buy Box: {buybox_seller}\n"
        f"\n"
        f"🧠 *AI Smart Insight:*\n"
        f"{ai_explanation[:500]}\n"
        f"\n"
        f"⏰ {timestamp}\n"
        f"⚡ _Powered by PriceWatch Pro_"
    )

    return message


# ── Singleton instance ──────────────────────────────────────────────
whatsapp_service = WhatsAppService()


async def dispatch_whatsapp_alert(
    asin: str,
    alert_type: str,
    details: Dict,
    ai_explanation: str,
) -> None:
    """
    Top-level entry point called from scheduler.py.
    Fully isolated — catches ALL exceptions so the caller is never affected.
    """
    try:
        if not whatsapp_service.enabled:
            return  # Silent no-op when disabled

        message = format_alert_message(asin, alert_type, details, ai_explanation)
        success = await whatsapp_service.send_message(message)

        if success:
            logger.info(f"WhatsApp alert dispatched for {asin} ({alert_type})")
        else:
            logger.warning(f"WhatsApp alert could not be delivered for {asin}")

    except Exception as e:
        # Absolute last-resort catch — this function MUST NEVER propagate errors
        logger.error(f"Unexpected error in WhatsApp dispatch for {asin}: {e}")
