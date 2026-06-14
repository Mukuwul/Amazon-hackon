"""In-memory cache of the agent's uploaded current photos, keyed by item.

Lets the Product Health Card show the ACTUAL photos the agent uploaded at grading
(audit finding 6) instead of the seeded current photo. Deliberately per-instance
and NOT persisted: base64 images exceed the DynamoDB 400 KB item limit, and the
card is built in the same flow on the same warm instance immediately after grading.
The grade FACTS persist via the passport; these photos are a presentation layer.
"""
from __future__ import annotations

MAX = 3

_recent: dict[str, list[str]] = {}


def remember(item_id: str, data_urls: list[str]) -> None:
    if data_urls:
        _recent[item_id] = list(data_urls)[:MAX]


def recent(item_id: str) -> list[str]:
    return _recent.get(item_id, [])
