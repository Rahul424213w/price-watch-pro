"""
BuyBox Change Detector — PriceWatch Pro Plugin
===============================================
Pure, stateless utility that compares two Buy Box states.

State schema:
    {
        "price":       float,
        "seller_name": str
    }

This module has ZERO external dependencies beyond Python stdlib.
It is completely isolated from the rest of the application.
"""

PRICE_TOLERANCE = 0.01  # Ignore differences smaller than ₹0.01 (float noise)


class BuyBoxChangeDetector:
    """Detects meaningful changes in Buy Box price or seller."""

    @staticmethod
    def has_changed(previous: dict, current: dict) -> bool:
        """
        Returns True if the Buy Box state changed meaningfully.

        Args:
            previous: dict with keys 'price' (float) and 'seller_name' (str)
            current:  dict with keys 'price' (float) and 'seller_name' (str)

        Returns:
            bool — True if seller changed OR price difference exceeds tolerance.
        """
        if not previous or not current:
            return False

        seller_changed = (
            str(previous.get("seller_name", "")).strip().lower()
            != str(current.get("seller_name", "")).strip().lower()
        )

        try:
            price_diff = abs(
                float(previous.get("price", 0)) - float(current.get("price", 0))
            )
            price_changed = price_diff > PRICE_TOLERANCE
        except (TypeError, ValueError):
            price_changed = False

        return seller_changed or price_changed

    @staticmethod
    def describe_change(previous: dict, current: dict) -> str:
        """Human-readable summary of what changed (for logging)."""
        parts = []
        prev_seller = str(previous.get("seller_name", "Unknown"))
        curr_seller = str(current.get("seller_name", "Unknown"))
        if prev_seller.lower() != curr_seller.lower():
            parts.append(f"Seller: {prev_seller!r} → {curr_seller!r}")

        try:
            prev_price = float(previous.get("price", 0))
            curr_price = float(current.get("price", 0))
            if abs(prev_price - curr_price) > PRICE_TOLERANCE:
                parts.append(f"Price: ₹{prev_price:.2f} → ₹{curr_price:.2f}")
        except (TypeError, ValueError):
            pass

        return ", ".join(parts) if parts else "No significant change"
