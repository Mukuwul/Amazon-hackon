"""Size social proof + Second Life buyback hint — the buyer-side PREVENT moment.

The best return is the one that never happens. Before a fit-risky purchase we show
how previous buyers of this size actually fit the item (static seeded signal) and a
resale/buyback estimate so the buyer knows the item holds value. The fit signal is
seeded data (size_signals.json); the resale hint is deterministic pricing math over
the seeded local buyers — no LLM, every rupee is auditable.
"""
from __future__ import annotations

from . import pricing, seed


def size_advice(asin: str) -> dict | None:
    """Fit proof (when the item is sized) + a resale hint, for any catalog ASIN.

    Returns None only if the ASIN isn't in the catalog at all. Non-sized items
    (books, appliances…) come back with fit=None but still carry a resale hint, so
    every storefront product has a working PDP.
    """
    item = seed.item_by_asin(asin)
    fit = seed.size_signal(asin)
    if item is None and fit is None:
        return None

    resale_hint = None
    if item is not None:
        buyers = seed.buyers_for_asin(asin)
        demand = pricing.demand_multiplier(len(buyers))
        # Lightly-used (grade B) resale at today's local demand — the "resells for
        # ~₹X near you later" buyback number.
        amount = pricing.resale_value(item["mrp"], item["category"],
                                      item["age_months"], "B", demand)
        resale_hint = {
            "amount": amount,
            "buyers_nearby": len(buyers),
            "top_offer": max((b["max_price"] for b in buyers), default=amount),
        }

    return {
        "asin": asin,
        "title": item["title"] if item else None,
        "category": item["category"] if item else None,
        "mrp": item["mrp"] if item else None,
        "thumb": item.get("thumb") if item else None,
        "fit": fit,
        "resale_hint": resale_hint,
    }
