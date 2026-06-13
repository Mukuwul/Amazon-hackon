"""Seed store: repo-baked demo data (items, orders, neighbors, images, cached AI responses).

Everything the demo needs ships in this package so a cold Lambda always has it.
"""
import json
from pathlib import Path

SEED_DIR = Path(__file__).parent
IMAGES_DIR = SEED_DIR / "images"
CACHED_DIR = SEED_DIR / "cached"

with open(SEED_DIR / "items.json", encoding="utf-8") as f:
    ITEMS = {it["item_id"]: it for it in json.load(f)["items"]}

with open(SEED_DIR / "orders.json", encoding="utf-8") as f:
    ORDERS = json.load(f)

with open(SEED_DIR / "neighbors.json", encoding="utf-8") as f:
    NEIGHBORS = json.load(f)


def get_item(item_id: str) -> dict | None:
    return ITEMS.get(item_id)


def list_items() -> list[dict]:
    """Items without the order block (that's detail-only)."""
    return [{k: v for k, v in it.items() if k != "order"} for it in ITEMS.values()]


def item_images(item_id: str) -> dict[str, list[Path]]:
    """Grouped image paths for an item: catalog / day0 / current, sorted."""
    d = IMAGES_DIR / item_id
    if not d.is_dir():
        return {"catalog": [], "day0": [], "current": []}
    files = sorted(d.glob("*.jpg")) + sorted(d.glob("*.jpeg")) + sorted(d.glob("*.png"))
    return {
        "catalog": [p for p in files if p.stem == "catalog"],
        "day0": [p for p in files if p.stem.startswith("day0")],
        "current": [p for p in files if p.stem.startswith("current")],
    }


def cached_response(item_id: str, call: str) -> dict | None:
    """Committed cached AI response, e.g. cached/SL-001.grade.json."""
    p = CACHED_DIR / f"{item_id}.{call}.json"
    if p.is_file():
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    return None
