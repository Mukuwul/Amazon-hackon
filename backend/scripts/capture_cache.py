"""Capture live grading responses into the committed cache.

Run from backend/ with creds in .env:  python scripts/capture_cache.py [SL-001 ...]
No args = every seeded item that has current photos. Writes seed/cached/{id}.grade.json;
at request time these serve as the source:"cached" fallback when both providers fail.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import seed  # noqa: E402
from app.grading import PROVIDER_MODEL, _grade_live  # noqa: E402


def main() -> None:
    ids = sys.argv[1:] or list(seed.ITEMS)
    for item_id in ids:
        item = seed.get_item(item_id)
        if item is None:
            print(f"{item_id}: unknown item, skipped")
            continue
        if not seed.item_images(item_id)["current"]:
            print(f"{item_id}: no current photos yet, skipped")
            continue
        core, provider = _grade_live(item)
        out = {**core.model_dump(), "model": PROVIDER_MODEL[provider]}
        path = seed.CACHED_DIR / f"{item_id}.grade.json"
        path.write_text(json.dumps(out, indent=2), encoding="utf-8")
        print(f"{item_id}: grade {out['grade']} (conf {out['confidence']}) via {provider} -> {path.name}")


if __name__ == "__main__":
    main()
