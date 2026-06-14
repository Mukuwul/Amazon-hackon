"""Size social proof + Second Life buyback hint — the buyer-side PREVENT moment.

The best return is the one that never happens. Before a fit-risky purchase we show
how previous buyers of this size actually fit the item (static seeded signal) and a
resale/buyback estimate so the buyer knows the item holds value. The fit signal is
seeded data (size_signals.json); the resale hint is deterministic pricing math over
the seeded local buyers — no LLM, every rupee is auditable.
"""
from __future__ import annotations

from . import pricing, seed

_OUTCOME_COPY = {
    "fit_true": "fit true to size",
    "ran_small": "ran a bit small",
    "ran_large": "ran a bit large",
}


def _brand(title: str | None) -> str | None:
    return title.split()[0] if title else None


def _personal(asin: str, persona: str, item: dict | None, fit: dict | None) -> dict | None:
    """A past-purchase note tied to THIS buyer, when their history matches the
    item's brand or category. None if no sized item / no match."""
    if item is None or fit is None:
        return None
    brand = _brand(item.get("title"))
    cat = item.get("category")
    for past in seed.purchase_profile(persona):
        if past.get("brand") == brand or past.get("category") == cat:
            matched_on = "brand" if past.get("brand") == brand else "category"
            rec = fit.get("recommended_size")
            direction = fit.get("direction")  # "up" | "down"
            move = "size up to" if direction == "up" else "size down to"
            label = brand if matched_on == "brand" else cat
            copy = (
                f"You bought a {past.get('title') or label} in {past['size']} — "
                f"it {_OUTCOME_COPY.get(past['fit_outcome'], 'fit')}. "
                f"This {label} {'runs slim' if direction == 'up' else 'runs large'}, "
                f"so we suggest you {move} {rec}."
            )
            return {
                "matched_on": matched_on,
                "past_title": past.get("title"),
                "past_size": past["size"],
                "past_outcome": past["fit_outcome"],
                "recommended_size": rec,
                "copy": copy,
            }
    return None


def size_advice(asin: str, persona: str | None = None) -> dict | None:
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
        "store_thumb": item.get("store_thumb") if item else None,
        "fit": fit,
        "personal": _personal(asin, persona, item, fit) if persona else None,
        "resale_hint": resale_hint,
    }
