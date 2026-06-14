"""Dynamic returns desk store (MT10 Fix 2).

The Ops returns desk = static return-class items (from /items) + this store. This
store holds the seeded placeholder extras plus any return a buyer initiates from
their order history (POST /returns). Buyer returns are persisted to DynamoDB
(best-effort, via store.py) so a return raised on one Lambda instance shows on the
Ops desk served by another (audit finding 5); the seeded extras stay in-memory.
A DynamoDB outage degrades to the old per-instance behaviour. No LLM.
"""
from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone

from . import seed, store

# Lazily seeded from returns_seed.json; dynamic buyer returns are appended.
_RETURNS: list[dict] | None = None


def _store() -> list[dict]:
    global _RETURNS
    if _RETURNS is None:
        _RETURNS = copy.deepcopy(seed.returns_seed())
    return _RETURNS


def _hydrate() -> None:
    """Pull buyer returns persisted by any instance into the local list (dedup by
    return_id). Best-effort — no-ops when DynamoDB is unset/unreachable."""
    if not store.enabled():
        return
    local = _store()
    have = {r.get("return_id") for r in local}
    for row in store.query("RETURNS"):
        entry = row.get("data") or {}
        rid = entry.get("return_id")
        if rid and rid not in have:
            local.append(entry)
            have.add(rid)


def list_returns() -> dict:
    _hydrate()
    # Newest first: dynamic buyer returns (appended) shown before seeded extras.
    return {"returns": list(reversed(_store()))}


def add_return(order: dict) -> dict:
    item = seed.item_by_asin(order.get("asin", "")) or {}
    # item_id lets the Ops desk open this return into the grading spine (inspection).
    # Only returns that resolve to a real catalog item are gradeable; others stay display-only.
    item_id = item.get("item_id")
    entry = {
        "return_id": f"RTN-B{uuid.uuid4().hex[:6].upper()}",
        "item_id": item_id,
        "title": order.get("title") or item.get("title") or "Returned item",
        "category": order.get("category") or item.get("category") or "other",
        "thumb": order.get("thumb") or item.get("thumb"),
        "return_reason": order.get("return_reason") or "buyer-initiated return",
        "price_paid": order.get("price_paid"),
        "order_id": order.get("order_id"),
        "persona": (order.get("persona") or "buyer").lower(),
        "source": "buyer",
        "status": "queued",
        "created_ts": datetime.now(timezone.utc).isoformat(),
    }
    _store().append(entry)
    store.put("RETURNS", entry["return_id"], entry)  # cross-instance (best-effort)
    return entry
