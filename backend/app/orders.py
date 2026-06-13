"""Buyer order history — the entry point for RECIRCULATE.

Exposes a persona's seeded order history and flags which orders can be resold (i.e.
the product has live local demand on the Idle Asset Radar). The monitor is resellable
→ a one-tap resell flows straight into /radar → /price-curve. Pure data, no LLM.
"""
from __future__ import annotations

from . import seed


def order_history(persona: str) -> list[dict] | None:
    history = seed.order_history(persona)
    if history is None:
        return None
    out = []
    for o in history:
        item = seed.item_by_asin(o["asin"])
        out.append({
            **o,
            "item_id": item["item_id"] if item else None,
            "resellable": bool(seed.dormant_units(o["asin"])),
        })
    return out
