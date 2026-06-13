"""Buyer order history — the entry point for RECIRCULATE.

Exposes a persona's seeded order history with: a return-window flag (the 10-day
Amazon-style return window, Fix 1) and a resellable flag (the product has live local
demand on the Idle Asset Radar). The monitor is resellable → a one-tap resell flows
into the new resell flow (/resell/*). Pure data, no LLM.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from . import seed

RETURN_WINDOW_DAYS = 10
# Demo "today" — fixed so the window math is stable across demo days. Matches the
# project's current date in CLAUDE.md context.
TODAY = date(2026, 6, 13)


def _window(purchase_date: str) -> dict:
    try:
        d = datetime.strptime(purchase_date, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return {"return_window_open": False, "return_by": None, "days_left": 0}
    by = d + timedelta(days=RETURN_WINDOW_DAYS)
    days_left = (by - TODAY).days
    return {
        "return_window_open": days_left >= 0,
        "return_by": by.isoformat(),
        "days_left": max(0, days_left),
    }


def order_history(persona: str) -> list[dict] | None:
    history = seed.order_history(persona)
    if history is None:
        return None
    out = []
    for o in history:
        item = seed.item_by_asin(o["asin"])
        out.append({
            **o,
            **_window(o["purchase_date"]),
            "item_id": item["item_id"] if item else None,
            "resellable": bool(seed.dormant_units(o["asin"])),
        })
    return out
