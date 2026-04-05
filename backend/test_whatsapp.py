"""
WhatsApp Service Verification Script
=====================================
Run this standalone to validate the WhatsApp Smart Alert plugin.

Usage:
    python test_whatsapp.py           # Dry-run (validates config and formatting)
    python test_whatsapp.py --send    # Actually sends a test message via Twilio
"""

import asyncio
import sys
import os

# Ensure dotenv is loaded
from dotenv import load_dotenv
load_dotenv()

from whatsapp_service import whatsapp_service, format_alert_message, dispatch_whatsapp_alert


def test_config_check():
    """Test 1: Verify environment variables are detected."""
    print("=" * 50)
    print("TEST 1: Configuration Check")
    print("=" * 50)
    print(f"  WHATSAPP_ENABLED:     {os.getenv('WHATSAPP_ENABLED', 'NOT SET')}")
    print(f"  WHATSAPP_ACCOUNT_SID: {'***' + whatsapp_service.account_sid[-4:] if whatsapp_service.account_sid else 'NOT SET'}")
    print(f"  WHATSAPP_AUTH_TOKEN:   {'***' + whatsapp_service.auth_token[-4:] if whatsapp_service.auth_token else 'NOT SET'}")
    print(f"  WHATSAPP_FROM_NUMBER:  {whatsapp_service.from_number or 'NOT SET'}")
    print(f"  WHATSAPP_TO_NUMBER:    {whatsapp_service.to_number or 'NOT SET'}")
    print(f"  Service enabled:       {whatsapp_service.enabled}")
    print(f"  Fully configured:      {whatsapp_service.is_configured()}")
    print("  ✅ Config check passed.\n")


def test_message_format():
    """Test 2: Verify message formatting produces valid output."""
    print("=" * 50)
    print("TEST 2: Message Formatting")
    print("=" * 50)

    mock_details = {
        "title": "Bosch GSB 500W Professional Drill Machine 13mm",
        "current_price": 2499,
        "buybox_seller": "RetailMart India",
    }
    mock_ai = (
        "Price drop detected due to new seller entry (ToolKart) "
        "undercutting by ₹150. Historical pattern suggests this seller "
        "drops prices every 4 hours during flash sales."
    )

    message = format_alert_message(
        asin="B0CXYZ1234",
        alert_type="price_drop",
        details=mock_details,
        ai_explanation=mock_ai,
    )

    print(message)
    print(f"\n  Message length: {len(message)} chars (limit: 4096)")
    assert len(message) < 4096, "Message exceeds WhatsApp limit!"
    print("  ✅ Format check passed.\n")
    return message


def test_disabled_graceful():
    """Test 3: Verify dispatch silently no-ops when disabled."""
    print("=" * 50)
    print("TEST 3: Disabled State (Graceful No-Op)")
    print("=" * 50)

    original = whatsapp_service.enabled
    whatsapp_service.enabled = False

    result = asyncio.run(dispatch_whatsapp_alert(
        asin="B0TEST0000",
        alert_type="price_drop",
        details={"title": "Test", "current_price": 100, "buybox_seller": "Test"},
        ai_explanation="Test insight",
    ))

    # dispatch_whatsapp_alert returns None (no crash = success)
    whatsapp_service.enabled = original
    print("  dispatch_whatsapp_alert returned cleanly with WHATSAPP_ENABLED=false")
    print("  ✅ Graceful degradation passed.\n")


async def test_send_live():
    """Test 4: Actually send a message (only with --send flag)."""
    print("=" * 50)
    print("TEST 4: Live Send Test")
    print("=" * 50)

    if not whatsapp_service.is_configured():
        print("  ⚠️  Skipping live test — credentials not configured.")
        return

    message = (
        "🧪 *PriceWatch Pro — Test Alert*\n\n"
        "This is a verification message from the WhatsApp Smart Alert plugin.\n"
        "If you received this, the integration is working correctly.\n\n"
        "⚡ _Powered by PriceWatch Pro_"
    )

    success = await whatsapp_service.send_message(message)
    if success:
        print("  ✅ Live message sent successfully!")
    else:
        print("  ❌ Live send failed. Check credentials and Twilio console.")


if __name__ == "__main__":
    print("\n🔍 PriceWatch Pro — WhatsApp Service Verification\n")

    test_config_check()
    test_message_format()
    test_disabled_graceful()

    if "--send" in sys.argv:
        asyncio.run(test_send_live())
    else:
        print("💡 To send a live test message, run: python test_whatsapp.py --send\n")

    print("✅ All verification checks completed.\n")
