"""Seller return-rate dashboard — the seller-side PREVENT moment.

Surfaces the seller's catalog sorted worst-first by return rate, so the listing
that bleeds the most returns is the first thing they see. Tapping a diagnosable SKU
reuses /diagnose-listing for the AI fix + projected drop. Pure data over the seeded
catalog — no LLM here.
"""
from __future__ import annotations

from . import seed


def seller_returns() -> dict:
    cat = seed.seller_catalog()
    skus = []
    for s in cat["skus"]:
        rate = round(s["returns"] / s["units_sold"] * 100) if s["units_sold"] else 0
        skus.append({**s, "return_rate_pct": rate})
    skus.sort(key=lambda x: x["return_rate_pct"], reverse=True)
    return {
        "seller": cat["seller"],
        "skus": skus,
        "total_units_sold": sum(s["units_sold"] for s in skus),
        "total_returns": sum(s["returns"] for s in skus),
    }
