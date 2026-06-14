"""Per-persona Green Ledger (MT15) — the personal slice of the impact metrics.

The global /metrics counts every routed item; this scopes the same CO₂ / landfill /
items-diverted math to ONE persona's own products (a buyer's order history, or a
seller's catalog), plus a small seeded baseline so the strip reads non-zero before the
live demo (mirrors metrics.BASELINE). Derived from passport ROUTED events — no
hardcoded ledger; reuses metrics.LANDFILL_KG. Pure Python, no LLM.
"""
from __future__ import annotations

from . import passport, seed
from .metrics import LANDFILL_KG

# CO₂ saved (kg) by reusing instead of writing off a unit — approx per category.
CO2_KG = {"footwear": 1.5, "electronics": 3.2, "apparel": 1.1, "appliances": 5.0,
          "books": 0.6, "home": 1.0, "bags": 1.8}

# Small per-persona pre-session baseline so the ledger strip isn't empty on a cold
# start (same intent as metrics.BASELINE — it's in the API, not hardcoded JSX).
BASELINE = {
    "rahul": {"items_diverted": 2, "co2_saved_kg": 4.7, "landfill_diverted_kg": 2.3},
    "vastram": {"items_diverted": 6, "co2_saved_kg": 11.8, "landfill_diverted_kg": 5.4},
}
_DEFAULT_BASELINE = {"items_diverted": 0, "co2_saved_kg": 0.0, "landfill_diverted_kg": 0.0}


def _owned_item_ids(persona: str) -> list[str]:
    """The catalog item_ids this persona 'owns': a buyer's order history, or a
    seller's catalog SKUs."""
    persona = persona.lower()
    history = seed.order_history(persona)
    if history:
        ids = []
        for o in history:
            it = seed.item_by_asin(o.get("asin", ""))
            if it:
                ids.append(it["item_id"])
        return ids
    if persona in ("vastram", "seller"):
        return [s["item_id"] for s in seed.seller_catalog().get("skus", [])]
    return []


def green_ledger(persona: str) -> dict:
    persona = persona.lower()
    base = BASELINE.get(persona, _DEFAULT_BASELINE)
    diverted = base["items_diverted"]
    co2 = base["co2_saved_kg"]
    landfill = base["landfill_diverted_kg"]
    for item_id in _owned_item_ids(persona):
        ev = passport.latest_event(item_id, "ROUTED")
        if not ev:
            continue
        d = ev["data"]
        if d["decision"] == "warehouse_relist":
            continue  # a warehouse relist isn't a diversion
        diverted += 1
        cat = seed.ITEMS[item_id]["category"]
        co2 += CO2_KG.get(cat, 1.0)
        if d["decision"] != "liquidate":
            landfill += LANDFILL_KG.get(cat, 1.0)
    return {
        "persona": persona,
        "items_diverted": diverted,
        "co2_saved_kg": round(co2, 1),
        "landfill_diverted_kg": round(landfill, 1),
    }
