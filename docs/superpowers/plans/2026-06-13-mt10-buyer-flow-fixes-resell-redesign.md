# MT10 — Buyer-flow fixes + resell redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.
> **No unit-test harness exists** in this repo (no pytest, no tests/). Per prior MTs, verification = curl against local uvicorn (`cd backend; uvicorn app.main:app --reload --port 8080`) + chrome-devtools browser walkthrough + a fresh verifier. Each task ends with a concrete curl/observe check, not a pytest run.

**Goal:** Fix 5 buyer/ops/resell defects in one MT — return window, de-mixed Ops returns desk with a buyer→ops link, purchase-history-personalized size advice, and a redesigned resell flow (confirm → photo→AI price → price/range slider → public flash-deals board → live cross-tab "I'm interested").

**Architecture:** Thin seed-backed FastAPI routes (iron rule: every number from an endpoint) + React screens reusing the MT3 design system. New backend modules: `returns.py`, `resell.py`; extended `orders.py`, `size.py`; new seed `returns_seed.json`, `purchase_profile.json`; +2 recent orders. New frontend screens: `ResellConfirm`, `ResellPrice`, `FlashDeals`, `MyResells`; edited `Inbox`, `BuyerStore`, `Pdp`, `App`, `lib/api.js`. In-memory per-instance stores (cart/passport pattern). Spine (SL-001) untouched. Zero new deps.

**Tech Stack:** FastAPI + Pydantic + Mangum (Lambda), React 19 + Tailwind v4 (Vite). Redeploy via `backend/deploy.ps1` (Docker up).

---

## Phase A — Backend (curl-verifiable against local uvicorn)

### Task A1: Return window on order history (Fix 1) + 2 recent orders

**Files:**
- Modify: `backend/app/orders.py`
- Modify: `backend/app/seed/orders.json` (add 2 recent orders to `rahul_order_history`)

- [ ] **Step 1: Add 2 recent orders** to `backend/app/seed/orders.json` `rahul_order_history` (today = 2026-06-13; window = 10 days). Append after the crib entry:

```json
    {"order_id": "171-7781002-RH04", "asin": "B0KURTA01", "title": "Vastram Men's Cotton Kurta (Navy Blue)", "purchase_date": "2026-06-09", "price_paid": 899, "status": "delivered"},
    {"order_id": "171-5540198-RH05", "asin": "B0SHOE500", "title": "Aurelle Women's Running Shoes", "purchase_date": "2026-06-11", "price_paid": 500, "status": "delivered"}
```

(Add a comma after the crib entry's `}`.)

- [ ] **Step 2: Compute window fields** in `backend/app/orders.py`. Replace the file body's `order_history` with:

```python
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
```

- [ ] **Step 3: Verify** (local uvicorn running):

Run: `curl -s http://localhost:8080/orders/rahul`
Expected: 5 orders. The 2024 orders → `"return_window_open": false`. The `2026-06-09` and `2026-06-11` orders → `"return_window_open": true` with `days_left` ≥ 0 and a `return_by` date. The monitor (`B0MONITOR1`) → `"resellable": true`; shirt/shoe → `false`.

- [ ] **Step 4: Commit**

```bash
git add backend/app/orders.py backend/app/seed/orders.json
git commit -m "feat(MT10): return-window fields + 2 recent orders on order history"
```

---

### Task A2: Returns store + buyer→ops link (Fix 2 backend)

**Files:**
- Create: `backend/app/returns.py`
- Create: `backend/app/seed/returns_seed.json`
- Modify: `backend/app/main.py` (import + 2 routes)

- [ ] **Step 1: Seed extra return rows** — create `backend/app/seed/returns_seed.json` (placeholder products; user replaces images later). These render on the Ops desk as display-only "queued for grading" rows:

```json
{
  "comment": "Extra placeholder return rows for the Ops returns desk (MT10 Fix 2). Display-only — not live-gradeable. Images are placeholders; replace later. Dynamic buyer returns (POST /returns) are appended at runtime in returns.py.",
  "returns": [
    {"return_id": "RTN-2001", "title": "Denimworks Slim-Fit Jeans (32)", "category": "apparel", "thumb": "/items/RTN-2001/current_1.jpg", "return_reason": "fit too tight", "price_paid": 1499, "source": "seed", "status": "queued"},
    {"return_id": "RTN-2002", "title": "BrewBot 2-Slice Toaster", "category": "appliances", "thumb": "/items/RTN-2002/current_1.jpg", "return_reason": "stopped heating", "price_paid": 1899, "source": "seed", "status": "queued"},
    {"return_id": "RTN-2003", "title": "AquaPure Steel Water Bottle (1L)", "category": "home", "thumb": "/items/RTN-2003/current_1.jpg", "return_reason": "leaks from cap", "price_paid": 699, "source": "seed", "status": "queued"}
  ]
}
```

- [ ] **Step 2: Load the seed** — in `backend/app/seed/__init__.py`, after the `dark_stores.json` load block (line ~32), add:

```python
with open(SEED_DIR / "returns_seed.json", encoding="utf-8") as f:
    RETURNS_SEED = json.load(f)["returns"]


def returns_seed() -> list[dict]:
    return RETURNS_SEED
```

- [ ] **Step 3: Returns store** — create `backend/app/returns.py`:

```python
"""Dynamic returns desk store (MT10 Fix 2).

The Ops returns desk = static return-class items (from /items) + this store. This
store holds the seeded placeholder extras plus any return a buyer initiates from
their order history (POST /returns). In-memory per-Lambda-instance, like the cart:
a cold start resets to the seed (fine for the demo; rock-solid locally). No LLM.
"""
from __future__ import annotations

import copy
from datetime import datetime, timezone

from . import seed

# Lazily seeded from returns_seed.json; dynamic buyer returns are appended.
_RETURNS: list[dict] | None = None
_counter = 0


def _store() -> list[dict]:
    global _RETURNS
    if _RETURNS is None:
        _RETURNS = copy.deepcopy(seed.returns_seed())
    return _RETURNS


def list_returns() -> dict:
    # Newest first: dynamic buyer returns (appended) shown before seeded extras.
    return {"returns": list(reversed(_store()))}


def add_return(order: dict) -> dict:
    global _counter
    _counter += 1
    item = seed.item_by_asin(order.get("asin", "")) or {}
    entry = {
        "return_id": f"RTN-B{_counter:03d}",
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
    return entry
```

- [ ] **Step 4: Routes** — in `backend/app/main.py`, add `returns as returns_mod` to the import on line 8, then add after the `/orders/{persona}` route (line ~215):

```python
class ReturnIn(BaseModel):
    persona: str = Field(default="buyer", max_length=20)
    order_id: str | None = Field(default=None, max_length=40)
    asin: str | None = Field(default=None, max_length=20)
    title: str | None = Field(default=None, max_length=120)
    category: str | None = Field(default=None, max_length=30)
    thumb: str | None = Field(default=None, max_length=120)
    return_reason: str | None = Field(default=None, max_length=120)
    price_paid: int | None = Field(default=None, ge=0, le=10_000_000)


@app.get("/returns")
def get_returns():
    """Ops returns desk: seeded extras + dynamic buyer-initiated returns."""
    return returns_mod.list_returns()


@app.post("/returns")
def post_return(body: ReturnIn):
    """A buyer initiates a return from order history → lands on the Ops desk."""
    return returns_mod.add_return(body.model_dump())
```

Update the import line 8 to: `from . import size, seller, orders as orders_mod, buyer, cascade as cascade_mod, returns as returns_mod`

- [ ] **Step 5: Verify**

Run: `curl -s http://localhost:8080/returns`
Expected: 3 seeded returns (RTN-2001..2003).

Run: `curl -s -X POST http://localhost:8080/returns -H "Content-Type: application/json" -d '{"persona":"rahul","order_id":"171-7781002-RH04","asin":"B0KURTA01","title":"Vastram Men'\''s Cotton Kurta (Navy Blue)","return_reason":"colour not as shown","price_paid":899}'`
Expected: a new entry with `"source":"buyer"`, `"return_id":"RTN-B001"`. A second `GET /returns` now lists 4, the buyer one first.

- [ ] **Step 6: Commit**

```bash
git add backend/app/returns.py backend/app/seed/returns_seed.json backend/app/seed/__init__.py backend/app/main.py
git commit -m "feat(MT10): returns store + GET/POST /returns (buyer-initiated returns land on Ops)"
```

---

### Task A3: Personalized size advice from purchase history (Fix 3)

**Files:**
- Create: `backend/app/seed/purchase_profile.json`
- Modify: `backend/app/seed/__init__.py` (load + accessor)
- Modify: `backend/app/size.py` (`personal` block + persona param)
- Modify: `backend/app/main.py` (`/size-advice` persona query param)

- [ ] **Step 1: Purchase profile seed** — create `backend/app/seed/purchase_profile.json`:

```json
{
  "comment": "Per-persona past sized purchases for personalized fit advice (MT10 Fix 3). Matched by brand (first word of an item title) or category. fit_outcome ∈ {fit_true, ran_small, ran_large}. Backs the `personal` block in GET /size-advice/{asin}?persona=...",
  "rahul": [
    {"brand": "Vastram", "category": "apparel", "size": "M", "fit_outcome": "fit_true", "title": "Vastram Linen Shirt"},
    {"brand": "Aurelle", "category": "footwear", "size": "UK 8", "fit_outcome": "ran_small", "title": "Aurelle Trail Sneakers"}
  ]
}
```

- [ ] **Step 2: Load it** — in `backend/app/seed/__init__.py`, after the returns_seed block, add:

```python
with open(SEED_DIR / "purchase_profile.json", encoding="utf-8") as f:
    PURCHASE_PROFILE = json.load(f)


def purchase_profile(persona: str) -> list[dict]:
    val = PURCHASE_PROFILE.get(persona.lower(), [])
    return val if isinstance(val, list) else []
```

- [ ] **Step 3: Personal block** — in `backend/app/size.py`, add a helper and a `persona` param. Replace the `size_advice` signature and add the personal block before the return:

```python
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
```

Then inside `size_advice`, change the final `return {...}` to include `personal`:

```python
    return {
        "asin": asin,
        "title": item["title"] if item else None,
        "category": item["category"] if item else None,
        "mrp": item["mrp"] if item else None,
        "thumb": item.get("thumb") if item else None,
        "fit": fit,
        "personal": _personal(asin, persona, item, fit) if persona else None,
        "resale_hint": resale_hint,
    }
```

- [ ] **Step 4: Route param** — in `backend/app/main.py`, update the `/size-advice/{asin}` route to accept `persona`:

```python
@app.get("/size-advice/{asin}")
def size_advice(asin: str, persona: str | None = None):
    """Buyer PDP: fit social proof (sized items) + personal history note + resale hint."""
    result = size.size_advice(asin, persona=persona)
    if result is None:
        raise HTTPException(status_code=404, detail="asin not in catalog")
    return result
```

- [ ] **Step 5: Verify**

Run: `curl -s "http://localhost:8080/size-advice/B0KURTA01?persona=rahul"`
Expected: `personal` is non-null, `matched_on":"brand"`, `copy` mentions "Vastram", size M, and "size up to L".

Run: `curl -s "http://localhost:8080/size-advice/B0KURTA01"` (no persona)
Expected: `"personal": null`, `fit` block unchanged.

- [ ] **Step 6: Commit**

```bash
git add backend/app/size.py backend/app/seed/purchase_profile.json backend/app/seed/__init__.py backend/app/main.py
git commit -m "feat(MT10): personalized size advice from purchase history (?persona)"
```

---

### Task A4: Resell engine — quote + listings + interest (Fix 4 backend)

**Files:**
- Create: `backend/app/resell.py`
- Modify: `backend/app/main.py` (import + 5 routes + Pydantic models)

- [ ] **Step 1: Resell module** — create `backend/app/resell.py`:

```python
"""Resell marketplace (MT10 Fix 4) — deterministic economics + an in-memory
listing/interest store.

Rahul lists a used order item; the quote trades reach (range_km) for price: a wider
radius reaches more local buyers (higher achievable price) but Amazon's delivery cut
grows with distance, so NET can peak mid-range. Buyers tap "I'm interested" on a
public board; the reseller polls the listing for the live feed (real cross-tab).

Stores are in-memory per-Lambda-instance (cart/passport pattern): cross-tab works
locally (one uvicorn process) and on a single warm Lambda. Reuses pricing.py +
seed.buyers_for_asin — pure Python, no LLM, can't fail live.
"""
from __future__ import annotations

import random
from datetime import datetime, timezone

from . import pricing, seed

RANGE_TIERS_KM = [3, 7, 15]
DELIVERY_BASE = 25      # ₹ flat
DELIVERY_PER_KM = 6     # ₹ per km of reach (Amazon's cut grows with distance)

# Seeded starter listings so the board isn't empty before Rahul lists.
_STARTER = [
    {"item_id": "SL-006", "asin": "B0HDPHN880", "title": "SonicWave ANC Headphones",
     "thumb": "/items/SL-006/current_1.jpg", "ask_price": 2600, "range_km": 7, "owner": "Sneha K."},
    {"item_id": "SL-008", "asin": "B0BCKPCK19", "title": "TrailMate 28L Backpack",
     "thumb": "/items/SL-008/current_1.jpg", "ask_price": 850, "range_km": 7, "owner": "Arjun M."},
]
_INTEREST_POOL = [
    ("Asha D.", 2.4), ("Nikhil R.", 3.6), ("Farah S.", 1.8), ("Imran K.", 4.1),
    ("Rhea M.", 5.2), ("Tanvi P.", 2.9), ("Kabir S.", 6.0),
]

_LISTINGS: dict[str, dict] | None = None
_seq = 0


def _delivery_cut(range_km: int) -> int:
    return round(DELIVERY_BASE + DELIVERY_PER_KM * range_km)


def quote(item_id: str, range_km: int, grade: str = "B") -> dict | None:
    item = seed.get_item(item_id)
    if item is None:
        return None
    grade = grade if grade in pricing.GRADE_FACTOR else "B"
    ai_suggested = pricing.resale_value(item["mrp"], item["category"],
                                        item["age_months"], grade, 1.0)
    buyers = seed.buyers_for_asin(item["asin"], range_km)
    reachable = len(buyers)
    demand = pricing.demand_multiplier(reachable)
    best_price = pricing.resale_value(item["mrp"], item["category"],
                                      item["age_months"], grade, demand)
    cut = _delivery_cut(range_km)
    curve = pricing.liquidity_curve([b["max_price"] for b in buyers] or [ai_suggested],
                                    best_price)
    return {
        "item_id": item_id,
        "range_km": range_km,
        "grade": grade,
        "ai_suggested": ai_suggested,
        "reachable_buyers": reachable,
        "best_price": best_price,
        "delivery_cut": cut,
        "net": best_price - cut,
        "points": curve["points"],
        "recommended": curve["recommended"],
        "range_tiers": [
            {"range_km": r, "reachable_buyers": len(seed.buyers_for_asin(item["asin"], r)),
             "delivery_cut": _delivery_cut(r)}
            for r in RANGE_TIERS_KM
        ],
    }


def _store() -> dict[str, dict]:
    global _LISTINGS, _seq
    if _LISTINGS is None:
        _LISTINGS = {}
        for s in _STARTER:
            _seq += 1
            lid = f"RL-{_seq:03d}"
            _LISTINGS[lid] = {
                "listing_id": lid, **s, "delivery_cut": _delivery_cut(s["range_km"]),
                "net": s["ask_price"] - _delivery_cut(s["range_km"]),
                "interests": [], "created_ts": datetime.now(timezone.utc).isoformat(),
            }
    return _LISTINGS


def create_listing(item_id: str, persona: str, ask_price: int, range_km: int) -> dict | None:
    global _seq
    item = seed.get_item(item_id)
    if item is None:
        return None
    store = _store()
    _seq += 1
    lid = f"RL-{_seq:03d}"
    store[lid] = {
        "listing_id": lid,
        "item_id": item_id,
        "asin": item["asin"],
        "title": item["title"],
        "thumb": item.get("thumb"),
        "ask_price": ask_price,
        "range_km": range_km,
        "delivery_cut": _delivery_cut(range_km),
        "net": ask_price - _delivery_cut(range_km),
        "owner": persona,
        "interests": [],
        "created_ts": datetime.now(timezone.utc).isoformat(),
    }
    return store[lid]


def list_listings() -> dict:
    return {"listings": list(reversed(list(_store().values())))}


def get_listing(listing_id: str) -> dict | None:
    return _store().get(listing_id)


def add_interest(listing_id: str, buyer_name: str | None = None,
                 distance_km: float | None = None, offer: int | None = None) -> dict | None:
    listing = _store().get(listing_id)
    if listing is None:
        return None
    if buyer_name is None or distance_km is None:
        name, dist = random.choice(_INTEREST_POOL)
        buyer_name = buyer_name or name
        distance_km = distance_km if distance_km is not None else dist
    interest = {
        "interest_id": f"IN-{len(listing['interests']) + 1:03d}",
        "buyer_name": buyer_name,
        "distance_km": distance_km,
        "offer": offer if offer is not None else listing["ask_price"],
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    listing["interests"].append(interest)
    return listing
```

- [ ] **Step 2: Routes + models** — in `backend/app/main.py`, add `resell as resell_mod` to the import line 8, then add after the checkout route (line ~260, before the Mangum handler):

```python
# --- MT10: resell marketplace (quote · listings · live interest) ---


class ResellQuoteIn(BaseModel):
    item_id: str = Field(..., min_length=1, max_length=20)
    range_km: int = Field(default=7, ge=1, le=50)
    grade: str | None = Field(default=None, max_length=2)


class ResellListIn(BaseModel):
    item_id: str = Field(..., min_length=1, max_length=20)
    persona: str = Field(default="rahul", max_length=20)
    ask_price: int = Field(..., ge=1, le=10_000_000)
    range_km: int = Field(default=7, ge=1, le=50)


class InterestIn(BaseModel):
    buyer_name: str | None = Field(default=None, max_length=40)
    distance_km: float | None = Field(default=None, ge=0, le=100)
    offer: int | None = Field(default=None, ge=0, le=10_000_000)


@app.post("/resell/quote")
def resell_quote(body: ResellQuoteIn):
    result = resell_mod.quote(body.item_id, body.range_km, grade=body.grade or "B")
    if result is None:
        raise HTTPException(status_code=404, detail="item not found")
    return result


@app.post("/resell/listings")
def resell_create(body: ResellListIn):
    result = resell_mod.create_listing(body.item_id, body.persona, body.ask_price, body.range_km)
    if result is None:
        raise HTTPException(status_code=404, detail="item not found")
    return result


@app.get("/resell/listings")
def resell_listings():
    return resell_mod.list_listings()


@app.get("/resell/listings/{listing_id}")
def resell_listing(listing_id: str):
    result = resell_mod.get_listing(listing_id)
    if result is None:
        raise HTTPException(status_code=404, detail="listing not found")
    return result


@app.post("/resell/listings/{listing_id}/interest")
def resell_interest(listing_id: str, body: InterestIn):
    result = resell_mod.add_interest(listing_id, body.buyer_name, body.distance_km, body.offer)
    if result is None:
        raise HTTPException(status_code=404, detail="listing not found")
    return result
```

Update import line 8 to also include `resell as resell_mod`.

- [ ] **Step 3: Verify the economics**

Run: `curl -s -X POST http://localhost:8080/resell/quote -H "Content-Type: application/json" -d '{"item_id":"SL-002","range_km":7,"grade":"B"}'`
Expected: `reachable_buyers` = 3 (monitor buyers ≤7 km: 1.9/3.5/4.4), `delivery_cut` = 67, `best_price` > `ai_suggested` (demand 1.10), `net` = best_price − 67, `range_tiers` shows 3km→1 buyer, 7km→3, 15km→4 with growing cuts.

Run: at range 3 vs 15 — confirm net peaks mid (3km cut 43 / 1 buyer ×1.0; 15km cut 115 / 4 buyers ×1.10): `curl` both and eyeball `net`.

- [ ] **Step 4: Verify listing + interest (cross-tab core)**

```bash
LID=$(curl -s -X POST http://localhost:8080/resell/listings -H "Content-Type: application/json" -d '{"item_id":"SL-002","persona":"rahul","ask_price":1000,"range_km":7}' | python -c "import sys,json;print(json.load(sys.stdin)['listing_id'])")
curl -s http://localhost:8080/resell/listings   # board shows 2 starters + this one
curl -s -X POST http://localhost:8080/resell/listings/$LID/interest -H "Content-Type: application/json" -d '{}'
curl -s http://localhost:8080/resell/listings/$LID   # interests has 1 entry (auto-filled name+distance+offer 1000)
```

Expected: board lists the new listing newest-first; after the interest POST, `GET /resell/listings/$LID` shows one interest with a name, distance, offer 1000.

- [ ] **Step 5: Commit**

```bash
git add backend/app/resell.py backend/app/main.py
git commit -m "feat(MT10): resell engine — /resell/quote + listings + live interest"
```

---

### Task A5: Update API + architecture docs, redeploy

**Files:**
- Modify: `docs/api-spec.md` (new endpoints + the `/orders` window fields + `/size-advice` persona)
- Modify: `docs/architecture.md` (MT10 section: returns store, size personalization, resell economics)

- [ ] **Step 1:** Document in `docs/api-spec.md`: `GET/POST /returns`; `/orders/{persona}` new fields (`return_window_open`, `return_by`, `days_left`); `/size-advice/{asin}?persona=` + `personal` block; `POST /resell/quote`, `POST/GET /resell/listings`, `GET /resell/listings/{id}`, `POST /resell/listings/{id}/interest`. Show one real response each (paste curl output).

- [ ] **Step 2:** Add an MT10 section to `docs/architecture.md`: return-window rule (10d), returns store (per-instance), size personalization (brand/category match), resell economics (range→reachable→demand_multiplier→best_price; delivery_cut = 25 + 6·km; net = best−cut), per-instance cross-tab caveat.

- [ ] **Step 3: Redeploy** (Docker running):

Run: `cd backend; ./deploy.ps1`
Expected: ends with `latest: digest: sha256...` + `Done. Deployed` (ignore the cosmetic ECR-login 400, per lessons.md).

- [ ] **Step 4: Verify deployed** — repeat A1/A2/A3/A4 curls against the Function URL `https://ahwfmhaqed45p5xxk2u663oi6m0mejgi.lambda-url.ca-central-1.on.aws`. All shapes match local.

- [ ] **Step 5: Commit**

```bash
git add docs/api-spec.md docs/architecture.md
git commit -m "docs(MT10): document returns, size persona, resell endpoints"
```

---

## Phase B — Frontend (zero new deps; reuse MT3 design system)

### Task B1: API client — new calls (Fix 1–4)

**Files:** Modify `frontend/src/lib/api.js`

- [ ] **Step 1:** In the `api` object, change `sizeAdvice` to take persona and add the new calls:

```javascript
  sizeAdvice: (asin, persona) =>
    req(`/size-advice/${asin}${persona ? `?persona=${persona}` : ""}`),
  // MT10
  returns: () => req("/returns"),
  addReturn: (body) => req("/returns", { method: "POST", body }),
  resellQuote: (body) => req("/resell/quote", { method: "POST", body }),
  createListing: (body) => req("/resell/listings", { method: "POST", body }),
  listings: () => req("/resell/listings"),
  listing: (id) => req(`/resell/listings/${id}`),
  addInterest: (id, body = {}) => req(`/resell/listings/${id}/interest`, { method: "POST", body }),
```

- [ ] **Step 2: Verify** `npm run build` (in `frontend/`) is clean. Commit:

```bash
git add frontend/src/lib/api.js
git commit -m "feat(MT10): api client — returns, resell, size persona"
```

---

### Task B2: Order history return window + resell entry (Fix 1 + Fix 4 entry)

**Files:** Modify `frontend/src/screens/BuyerStore.jsx`

- [ ] **Step 1:** In the `Orders` sub-component, gate the Return button on `o.return_window_open` and route Resell to the new flow. Replace the button block:

```jsx
          <div className="mt-3 flex gap-2">
            {o.return_window_open ? (
              <button
                onClick={() => onReturn(o)}
                className="flex-1 h-9 rounded-lg text-[12.5px] font-700 bg-white text-sl-ink ring-1 ring-sl-line hover:bg-sl-paper transition active:scale-[0.98]"
              >
                Return or replace · {o.days_left}d left
              </button>
            ) : (
              <span className="flex-1 h-9 rounded-lg text-[11px] font-600 text-sl-muted bg-sl-paper ring-1 ring-sl-line grid place-items-center">
                Return window closed{o.return_by ? ` · ${fmtDate(o.return_by)}` : ""}
              </span>
            )}
            {o.resellable ? (
              <button
                onClick={() => onResell(o)}
                disabled={busy}
                className="flex-1 h-9 rounded-lg text-[12.5px] font-800 bg-sl-green text-white hover:bg-sl-green-deep transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {busy && <Spinner className="w-3.5 h-3.5" />}
                Resell on Second Life
              </button>
            ) : (
              <span className="flex-1 h-9 rounded-lg text-[11px] font-600 text-sl-muted bg-sl-paper ring-1 ring-sl-line grid place-items-center">
                No local demand yet
              </span>
            )}
          </div>
```

- [ ] **Step 2:** Add a "Flash deals near you" and "My resells" tab to the tab bar (after Notifications). Add to the `Tab` row:

```jsx
        <Tab active={tab === "flash"} onClick={() => onTab("flash")}>Flash deals</Tab>
        <Tab active={tab === "resells"} onClick={() => onTab("resells")}>My resells</Tab>
```

And render them (the two new screens are passed through as props `flash` / `resells` render slots — wired in App, Task B5). Add after the notifications line:

```jsx
      {tab === "flash" && onFlash}
      {tab === "resells" && onResells}
```

(`onFlash`/`onResells` are React nodes passed from App — keeps BuyerStore presentational.)

- [ ] **Step 3:** Add `onFlash, onResells` to the `BuyerStore` props destructure.

- [ ] **Step 4: Verify + commit** — `npm run build` clean.

```bash
git add frontend/src/screens/BuyerStore.jsx
git commit -m "feat(MT10): order-history return window + flash/resells tabs"
```

---

### Task B3: Ops returns desk de-mix + /returns rows (Fix 2 frontend)

**Files:** Modify `frontend/src/screens/Inbox.jsx`, `frontend/src/App.jsx`

- [ ] **Step 1:** In `App.jsx`, fetch `/returns` when opening Ops and pass to Inbox. Add state `const [returns, setReturns] = useState(null);` and in `openOps`:

```javascript
  function openOps() {
    setErr(null);
    setScreen("inbox");
    api.returns().then((d) => setReturns(d.returns)).catch(() => setReturns([]));
  }
```

Pass `returns={returns}` to `<Inbox ... />`.

- [ ] **Step 2:** Rewrite `Inbox.jsx` to two sections. Replace the lanes/queued logic. The hero (SL-001) keeps the full grade flow (`onOpen`); SL-003/SL-007 (return_initiated) + `/returns` rows are display-only "received · queued for grading"; SL-004 (rto) is its own COD section (tappable → seal flow via `onOpen`). Key code:

```jsx
export default function Inbox({ items, returns, metrics, loading, forceCached, onForceCached, onOpen, onShowMetrics, onBack }) {
  const hero = items.find((i) => i.item_id === "SL-001");
  const returnItems = items.filter((i) => i.status === "return_initiated" && i.item_id !== "SL-001");
  const rto = items.filter((i) => i.status === "rto_in_transit");
  const dyn = returns || [];
  // ... banner unchanged ...
  // Section 1: "Returns to process" → hero (playable) + returnItems (display) + dyn (display)
  // Section 2: "COD refused / RTO" → rto rows (tappable, onOpen → seal lane)
}
```

For display-only return rows use a non-button card with a `received · queued for grading` chip. For dynamic `/returns` rows, render title/category/thumb/return_reason + a `source === "buyer" ? "Buyer return" : "Queued"` chip. (Idle SL-002/005/006/008 and the diagnose lane are no longer rendered here.)

- [ ] **Step 3:** Remove the now-unused `LANE` map and the radar/diagnose lane rendering from Inbox. Keep `StatusChip`, `Chevron`, `RowSkeleton`, `StageToggle`.

- [ ] **Step 4: Verify** — `npm run build` clean; in the browser, Ops shows only Returns + COD sections, no idle/diagnose noise; hero still opens the grade flow; SL-004 opens the seal lane.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/Inbox.jsx frontend/src/App.jsx
git commit -m "feat(MT10): de-mixed Ops returns desk + dynamic /returns rows"
```

---

### Task B4: Buyer Return → POST /returns wiring (Fix 2 link)

**Files:** Modify `frontend/src/App.jsx`

- [ ] **Step 1:** Replace `returnOrder` to POST the return and refresh:

```javascript
  function returnOrder(order) {
    api.addReturn({
      persona: PERSONA,
      order_id: order.order_id,
      asin: order.asin,
      title: order.title,
      return_reason: "buyer-initiated return",
      price_paid: order.price_paid,
    }).then((entry) => {
      setReturns((prev) => (prev ? [entry, ...prev] : [entry]));
      setToast({
        title: "Return started",
        message: `${order.title} → sent to the Returns desk for AI grading.`,
      });
    }).catch((e) =>
      setErr({ message: `Couldn't start the return (${e.detail || e.message}).` })
    );
  }
```

- [ ] **Step 2: Verify** — in the browser, returning the recent Vastram order (window open) shows the toast; switching to Ops shows the new "Buyer return" row at top of Returns. Commit:

```bash
git add frontend/src/App.jsx
git commit -m "feat(MT10): buyer return posts to /returns and shows on Ops"
```

---

### Task B5: PDP personal block (Fix 3 frontend)

**Files:** Modify `frontend/src/screens/Pdp.jsx`, `frontend/src/App.jsx`

- [ ] **Step 1:** In `App.jsx` `openPdp`, pass the persona: `const a = await api.sizeAdvice(gridItem.asin, PERSONA);`

- [ ] **Step 2:** In `Pdp.jsx`, render `advice.personal` as a highlighted card above the social-proof `fit` block:

```jsx
      {advice.personal && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-sl-green-deep text-white p-4 shadow-card anim-fade-up">
            <div className="flex items-center gap-1.5 mb-1.5">
              <SLBadge />
              <span className="text-[10px] font-800 uppercase tracking-wider text-sl-mint">From your purchases</span>
            </div>
            <p className="text-[13.5px] leading-snug">{advice.personal.copy}</p>
          </div>
        </div>
      )}
```

- [ ] **Step 3: Verify** — PDP for the Vastram kurta shows the green "From your purchases" card referencing the past M; a non-Vastram/non-apparel item shows no personal card. `npm run build` clean. Commit:

```bash
git add frontend/src/screens/Pdp.jsx frontend/src/App.jsx
git commit -m "feat(MT10): PDP personal size note from purchase history"
```

---

### Task B6: Resell flow screens — confirm → price/range (Fix 4 part 1)

**Files:** Create `frontend/src/screens/ResellConfirm.jsx`, `frontend/src/screens/ResellPrice.jsx`; modify `frontend/src/App.jsx`

- [ ] **Step 1: ResellConfirm.jsx** — confirm sheet with bought price/date/warranty + est value preview, then a photo-upload step reusing the ItemIntro upload pattern (`fileToGradeImage` from `lib/image`). Two-stage: (a) details confirm → Continue; (b) upload → "Get AI price" calls `onGrade(b64[])`. Props: `{ order, item, busy, quotePreview, onContinue, onGrade, onBack }`. Use `FooterAction`, `Thumb`, `lib/image`. Show `order.price_paid`, `fmtDate(order.purchase_date)`, `item.warranty_months`, and `quotePreview?.ai_suggested` as "Estimated resale ~₹X".

- [ ] **Step 2: ResellPrice.jsx** — range selector (3/7/15 from `quote.range_tiers`) + price slider over `quote.points` (mirror `LiquidityScreen`'s slider/curve). On range change call `onRange(km)` (re-quotes). Show `best_price`, `delivery_cut`, `net` (the trade-off), `reachable_buyers`. List → `onList({ ask_price, range_km })`. Props: `{ item, quote, range, busy, onRange, onList, onBack }`. Highlight net; copy: "Wider reach lifts the price buyers will pay, but Amazon's delivery cut grows — your take-home is **net**."

- [ ] **Step 3: App wiring** — add state `resellOrder2`/`resellQuote`/`resellRange`/`resellGrade`/`resellListing` and handlers:

```javascript
  const [resellItem, setResellItem] = useState(null);
  const [resellQuote, setResellQuote] = useState(null);
  const [resellRange, setResellRange] = useState(7);
  const [resellGrade, setResellGrade] = useState("B");

  // Orders → Resell → confirm sheet (NEW flow; old radar resell stays for the notif nudge)
  async function startResell(order) {
    if (!order.resellable || !order.item_id) return;
    resetItemState();
    setOrigin("buyer");
    const detail = await api.item(order.item_id).catch(() => null);
    const it = detail ? { ...detail.item } : { item_id: order.item_id, asin: order.asin, title: order.title };
    setResellItem({ ...it, order });
    setResellRange(7); setResellGrade("B"); setResellQuote(null);
    const q = await api.resellQuote({ item_id: it.item_id, range_km: 7, grade: "B" }).catch(() => null);
    setResellQuote(q);
    setScreen("resellConfirm");
  }

  async function resellGradePhotos(currentImages) {
    setBusy(true);
    try {
      const g = await api.grade(resellItem.item_id, true, currentImages); // cached-safe floor
      const grade = g.grade || "B";
      setResellGrade(grade);
      const q = await api.resellQuote({ item_id: resellItem.item_id, range_km: resellRange, grade });
      setResellQuote(q);
      setScreen("resellPrice");
    } catch (e) {
      setErr({ message: `Couldn't price the photos (${e.detail || e.message}).` });
    } finally { setBusy(false); }
  }

  async function resellSetRange(km) {
    setResellRange(km);
    const q = await api.resellQuote({ item_id: resellItem.item_id, range_km: km, grade: resellGrade });
    setResellQuote(q);
  }

  async function resellList({ ask_price, range_km }) {
    setBusy(true);
    try {
      const lst = await api.createListing({ item_id: resellItem.item_id, persona: PERSONA, ask_price, range_km });
      setToast({ title: "Listed on Flash deals", message: `${resellItem.title} · ${inr(ask_price)} — buyers within ${range_km} km can tap Interested.` });
      openBuyer("resells");
    } catch (e) {
      setErr({ message: `Couldn't list (${e.detail || e.message}).` });
    } finally { setBusy(false); }
  }
```

Pass `onResell={startResell}` to BuyerStore (replaces the old `resellOrder` for the Orders tab; keep `resellOrder` for the notification nudge `openNotif`). Render the two screens:

```jsx
        {screen === "resellConfirm" && resellItem && (
          <ResellConfirm order={resellItem.order} item={resellItem} busy={busy}
            quotePreview={resellQuote} onContinue={() => {}} onGrade={resellGradePhotos}
            onBack={() => openBuyer("orders")} />
        )}
        {screen === "resellPrice" && resellItem && resellQuote && (
          <ResellPrice item={resellItem} quote={resellQuote} range={resellRange} busy={busy}
            onRange={resellSetRange} onList={resellList} onBack={() => setScreen("resellConfirm")} />
        )}
```

- [ ] **Step 4: Verify** — `npm run build` clean; Orders→Resell (monitor) → confirm sheet → upload photo → AI price → range changes net → "List" lands on My resells with a toast.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/ResellConfirm.jsx frontend/src/screens/ResellPrice.jsx frontend/src/App.jsx frontend/src/screens/BuyerStore.jsx
git commit -m "feat(MT10): resell confirm + price/range screens"
```

---

### Task B7: Flash deals board + My resells live feed (Fix 4 part 2, cross-tab)

**Files:** Create `frontend/src/screens/FlashDeals.jsx`, `frontend/src/screens/MyResells.jsx`; modify `frontend/src/App.jsx`, `frontend/src/screens/BuyerStore.jsx`

- [ ] **Step 1: FlashDeals.jsx** — public board: `useEffect` loads `api.listings()` (and a ~4s poll so a freshly-listed item from the other tab appears). Each card: thumb, title, ask_price, range, owner, "I'm interested" button → `api.addInterest(listing_id)` then optimistic "Interested ✓ · seller notified". Self-contained (does its own fetch); takes no props except an optional `apiRef`. Use `inr`, `Thumb`, `Spinner`.

- [ ] **Step 2: MyResells.jsx** — Rahul's listings (filter `api.listings()` where `owner === PERSONA`), each polls `api.listing(id)` (~3s, cleared on unmount) and renders the live interested-buyers feed (name · distance km · ₹offer) appended as buyers tap from the other tab. Empty state: "No active resells — list one from Your orders." Use `inr`, `Spinner`.

```jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { inr } from "../lib/format";

export default function MyResells({ persona }) {
  const [mine, setMine] = useState(null);
  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const { listings } = await api.listings();
        if (alive) setMine(listings.filter((l) => l.owner === persona));
      } catch { /* keep last */ }
    }
    tick();
    const t = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [persona]);
  // render mine[].interests live (name · distance · offer); empty state otherwise
}
```

- [ ] **Step 3: App wiring** — pass the nodes into BuyerStore:

```jsx
            onFlash={<FlashDeals />}
            onResells={<MyResells persona={PERSONA} />}
```

(import both screens at top of App.jsx).

- [ ] **Step 4: Verify cross-tab** — open the app in two tabs. Tab 1: list the monitor (Task B6). Tab 2: Buyer → Flash deals → tap "I'm interested" on that listing. Tab 1: Buyer → My resells → within ~3s the interested buyer appears with name + distance + ₹. (Locally this is rock-solid: one uvicorn process. Note the per-instance caveat for Lambda.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/FlashDeals.jsx frontend/src/screens/MyResells.jsx frontend/src/App.jsx frontend/src/screens/BuyerStore.jsx
git commit -m "feat(MT10): flash-deals board + my-resells live interest feed"
```

---

### Task B8: Placeholder images for new return rows + final build

**Files:** `frontend/public/items/RTN-2001..2003/current_1.jpg` (placeholders)

- [ ] **Step 1:** The 3 seeded return rows reference `/items/RTN-200X/current_1.jpg`. The `Thumb` component already falls back to a category tile on 404 (lessons.md MT3), so missing images are fine (clean tiles, expected 404s). No action required unless real images are dropped later. Confirm the tiles render (no broken-image icon).

- [ ] **Step 2: Final build** — `cd frontend; npm run build`. Expected: clean, no new deps, bundle ~300KB JS.

- [ ] **Step 3: Push** (frontend auto-deploys on push to Vercel):

```bash
git add -A && git commit -m "chore(MT10): final build check" --allow-empty
git push origin main
```

---

## Phase C — Verify end-to-end

- [ ] **C1:** Local walkthrough via chrome-devtools (`localhost:5173`, backend = deployed or local):
  - Fix 1: Buyer→Your orders — 2024 orders "window closed"; recent 2 show "Return · Nd left".
  - Fix 2: Return a recent order → toast → Ops shows it under Returns (Buyer return chip); Ops shows ONLY Returns + COD/RTO (no idle/diagnose).
  - Fix 3: Buyer→Shop→Vastram kurta PDP → green "From your purchases" personal card.
  - Fix 4: Orders→Resell (monitor) → confirm (price/date) → upload → AI price → range slider changes net → List → My resells; second tab → Flash deals → I'm interested → first tab My resells shows the buyer live.
  - Spine: Ops→shoe (SL-001) → grade→route→Health Card→radar ping still clean.
- [ ] **C2:** 0 unexpected console errors (only the documented image-404 tiles).
- [ ] **C3:** Fresh-context verifier subagent walks the 5 fixes + spine and signs off.

---

## Self-review notes
- **Spec coverage:** Fix 1 → A1/B2. Fix 2 → A2/B3/B4. Fix 3 → A3/B5. Fix 4 → A4/B6/B7. Docs → A5. All covered.
- **Per-instance caveat** (returns, listings, interests) documented in A2/A4/A5 and design.
- **Cut-from-bottom** (if long): drop range control (B6 fixed range) then cross-tab poll (B7 manual refresh) — confirm→photo→AI price→list→board→interest stays.
- **Types:** `api.resellQuote/createListing/listings/listing/addInterest/returns/addReturn` defined in B1, used in B6/B7/B4/B3. `personal` block (A3) consumed in B5. `return_window_open/return_by/days_left` (A1) consumed in B2.
