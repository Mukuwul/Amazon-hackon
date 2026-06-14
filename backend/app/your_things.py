"""'Your Things' — the owner-side view of the invisible warehouse (MT15).

Every product a persona has bought, valued live as idle inventory: a well-kept unit
grades ~B, depreciates by age via pricing.py, and its life-stage (from the seeded
curve) flags when it's time to resell. The running total is "the dormant value your
home is holding" — the pull twin of the demand-driven Idle Asset Radar (which pushes
from the buyer side). Every rupee is DERIVED (no hardcoded value); pure Python, no LLM.
"""
from __future__ import annotations

from . import orders, pricing, seed
from .lifestage import DUE_FRACTION, _months_owned

# A still-owned, well-kept unit is valued at a like-kept grade for idle resale
# (matches lifestage.py so the figures reconcile across screens).
IDLE_GRADE = "B"
DEFAULT_CATEGORY = "home"


def _thing(o: dict, today) -> dict:
    asin = o.get("asin")
    item = seed.item_by_asin(asin) if asin else None
    category = (item or {}).get("category") or o.get("category") or DEFAULT_CATEGORY
    mrp = (item or {}).get("mrp") or o.get("price_paid") or 0
    months_owned = _months_owned(o.get("purchase_date"), today)

    # Current resale value + next-month value from the deterministic pricing engine;
    # the gap is the monthly value decay (auditable, ties to /life-stage).
    resale_value = pricing.resale_value(mrp, category, months_owned, IDLE_GRADE, 1.0)
    next_value = pricing.resale_value(mrp, category, months_owned + 1, IDLE_GRADE, 1.0)
    decay_per_month = max(0, resale_value - next_value)

    curve = seed.lifestage_curve(asin, category) or {
        "typical_life_months": 24, "stage_label": "useful life"}
    typical = curve["typical_life_months"]
    stage_pct = round(min(months_owned / typical, 1.0) * 100) if typical else 0
    due_to_resell = months_owned >= round(typical * DUE_FRACTION)

    return {
        "order_id": o.get("order_id"),
        "asin": asin,
        "item_id": (item or {}).get("item_id"),
        "title": o.get("title") or (item or {}).get("title"),
        "category": category,
        "thumb": (item or {}).get("thumb"),
        "purchase_date": o.get("purchase_date"),
        "price_paid": o.get("price_paid"),
        "months_owned": months_owned,
        "typical_life_months": typical,
        "stage_label": curve.get("stage_label", "useful life"),
        "stage_pct": stage_pct,
        "due_to_resell": due_to_resell,
        "resale_value": resale_value,
        "decay_per_month": decay_per_month,
        # Only catalog-resolved items can flow into the resell grade/price flow
        # (matches orders.py — listing creates the flash deal, demand follows).
        "resellable": item is not None,
    }


def your_things(persona: str) -> dict | None:
    """Every owned product valued as idle inventory + the dormant-value total.

    Returns None only if the persona has no seeded order history. Highest-value
    things first, so the dashboard leads with what's worth reselling."""
    history = seed.order_history(persona)
    if history is None:
        return None
    today = orders.TODAY
    things = [_thing(o, today) for o in history]
    things.sort(key=lambda t: t["resale_value"], reverse=True)
    return {
        "persona": persona.lower(),
        "total_dormant_value": sum(t["resale_value"] for t in things),
        "item_count": len(things),
        "due_count": sum(1 for t in things if t["due_to_resell"]),
        "things": things,
    }
