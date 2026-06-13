# MT10 — Buyer-flow fixes + resell redesign (design)

Date: 2026-06-13
Status: approved (brainstorm), pre-plan
Owner: A (backend) + B (frontend), single mega-MT this session

## Why

Five demo-quality defects in the buyer/ops/resell story, to fix **before** MT5 (bulletproof). MT5 would otherwise be polishing these in their broken state. Decided with the user this session: one mega-MT (all 5), resell live feed is **real cross-tab**, return→ops link via a **backend returns store**.

The ⭐ spine (SL-001 scan → delta-grade → VRS → Health Card → radar ping) is NOT touched. Iron rule holds: every number on screen comes from an endpoint, not hardcoded JSX. New "mock" data is seed-JSON + a thin route, never fake JSX.

## Scope = 5 fixes

### Fix 1 — Return/replace window
**Problem:** `BuyerStore.jsx` Orders shows "Return or replace" on *every* order unconditionally; Rahul's seed orders are all 2024 (long past any window).

**Design:**
- `orders.py` computes per order, against today (`2026-06-13`), a 10-day window from `purchase_date` (treated as the delivered date):
  - `return_window_open: bool`
  - `return_by: "YYYY-MM-DD"`
  - `days_left: int` (≥0 when open, else 0)
- `BuyerStore` Orders renders the **Return or replace** button active only when `return_window_open` is true (shows "· {days_left}d left"); otherwise a disabled pill "Return window closed · {return_by}".
- Add **2 recent orders** to `seed/orders.json → rahul_order_history` dated within the window (relative to 2026-06-13) so Return is demoable. One is a **Vastram** apparel item (brand thread for Fix 3). These recent orders are the ones a buyer can return into Ops (Fix 2).

**Verify:** old 2024 orders show "window closed"; the 2 recent orders show an active Return button with days-left; numbers come from `/orders/rahul`.

### Fix 2 — Ops returns desk (de-mix) + buyer→ops link
**Problem:** `Inbox.jsx` mixes returns, RTO, idle items, and the radar/diagnose lanes into one list — "things are mixed up".

**Design:**
- NEW `backend/app/returns.py` + `seed/returns_seed.json`:
  - `seed/returns_seed.json` — a few placeholder **extra return rows** (any images; user replaces later): e.g. a jeans, a toaster — each `{return_id, title, category, thumb, return_reason, price_paid, source:"seed", status:"queued"}`.
  - In-memory per-instance store `_RETURNS` seeded from `returns_seed.json` (mirrors the cart/passport per-instance pattern; cold start resets — fine for demo, rock-solid locally / single warm Lambda).
  - `GET /returns` → `{returns: [...]}` (seeded extras + dynamic buyer returns, newest first).
  - `POST /returns` body `{persona, order_id, asin, title, category?, thumb?, return_reason?, price_paid?}` → appends a `{return_id, source:"buyer", status:"queued", ...}` entry, returns it.
- `Inbox.jsx` redesigned to **two sections only**:
  1. **Returns to process** — `/items` where `status == "return_initiated"` (SL-001 shoe = hero/START HERE, SL-003 kurta, SL-007 bottle) **+** `/returns` rows (seeded extras + dynamic buyer returns).
  2. **COD refused / RTO** — `/items` where `status == "rto_in_transit"` (SL-004 mixer).
  - Idle items (SL-002, SL-005, SL-006, SL-008) and the diagnose lane (SL-003 is a *return* here, not a diagnose lane) are **removed from Ops** — radar/idle lives in the Buyer view, diagnose lives in the Seller view. (SL-003 still reachable as a seller diagnose drill-down from SellerDashboard; that path is unchanged.)
- **Playability:** the hero SL-001 keeps the full live grade→route→card spine. All other return rows (SL-003/007, seeded extras, dynamic buyer returns) are **display-only** "received · queued for grading" rows with a clean status chip — NOT tappable into live grading (avoids the live-grade 502 on photoless items; keeps MT5's bulletproof audit clean). This was approved inline.
- Buyer→ops link: `BuyerStore` Return button (Fix 1) calls `POST /returns` then surfaces a toast; the Ops desk shows the new row on next open / `GET /returns`. App refetches `/returns` when entering Ops.

**Verify:** Ops shows exactly Returns + RTO, no idle/diagnose noise; a buyer Return on a recent order adds a row visible on the Ops desk via `/returns`; spine hero still fully playable.

### Fix 3 — Size advice personalized from purchase history
**Problem:** `size_signals.json` advice is generic ("68% of buyers…"); user wants it tied to the buyer's own history ("you bought an M before; this brand runs small, size up/down").

**Design:**
- NEW `seed/purchase_profile.json`: per persona, a list of past sized purchases `{brand, category, size, fit_outcome}` where `fit_outcome ∈ {"fit_true","ran_small","ran_large"}`. Rahul has a **Vastram apparel** entry (size M, fit_true) and a footwear entry.
- `size.py → size_advice(asin, persona=None)`:
  - Keep the existing `fit` (social proof) + `resale_hint` blocks unchanged.
  - Add a `personal` block when (a) `persona` given, (b) the item is sized, and (c) the profile has a matching **brand or category**:
    - `{matched_on, past_size, past_outcome, recommended_size, copy}` where `copy` is composed from the brand/category + this item's `direction` (from `size_signals`) + the past size, e.g. *"You bought a Vastram shirt in M and it fit true — but this kurta runs slim. We suggest sizing up to L."* If no match → `personal: null`.
  - Brand is derived from the item title's leading word (e.g. "Vastram", "Aurelle") — no schema change to items.json needed.
- `lib/api.js`: `sizeAdvice(asin, persona)` → `GET /size-advice/{asin}?persona=rahul`.
- `Pdp.jsx`: render the `personal` block (when present) as the primary, highlighted advice above the existing social-proof distribution.

**Verify:** PDP for the Vastram kurta (as persona=rahul) shows a personalized line referencing the past M purchase; a non-matching item shows only the existing social proof; copy + sizes come from `/size-advice`.

### Fix 4 — Resell redesign (Rahul = reseller; shoppers = buyers; cross-tab)
**Problem:** Orders→Resell jumps straight to the radar/slider. User wants: confirm box → photo upload → AI price → slider, plus a public flash-deals board where buyers tap "I'm interested" and Rahul sees live offers, with a range/delivery-cost trade-off.

**Backend — NEW `backend/app/resell.py` (+ no new seed needed; reuses items/pricing):**
In-memory per-instance stores `_LISTINGS` (and interests nested per listing). Pure-Python economics over `pricing.py` — no LLM, deterministic, can't fail live.

Endpoints:
- `POST /resell/quote` body `{item_id, grade?, range_km}` → `{ai_suggested, reachable_buyers, best_price, delivery_cut, net, price_points:[…]}`.
  - `ai_suggested` = `pricing.resale_value(mrp, category, age, grade or "B", demand=1.0)`.
  - `reachable_buyers(range_km)` = a monotonic step curve (e.g. 3km→2, 7km→4, 15km→7 buyers).
  - `best_price` = `pricing.resale_value(..., demand=demand_multiplier(reachable_buyers))` (more competing buyers → higher achievable price).
  - `delivery_cut` = `round(base + per_km * range_km)` (e.g. base 25, per_km 6) — Amazon's deduction, grows with reach.
  - `net = best_price − delivery_cut`.
  - `price_points` = a small liquidity curve (ask → buyers_at_price → est_days_to_sell) for the slider, scaled to `reachable_buyers`.
- `POST /resell/listings` body `{item_id, persona, ask_price, range_km}` → creates `{listing_id, item_id, title, thumb, ask_price, range_km, delivery_cut, net, owner, distance_anchor, created_ts, interests:[]}`; returns it. Appears on the board.
- `GET /resell/listings` → `{listings:[…]}` (all open listings — the public **Flash deals near you** board; newest first).
- `POST /resell/listings/{listing_id}/interest` body `{buyer_name?, distance_km?, offer?}` → appends an interest `{interest_id, buyer_name, distance_km, offer, ts}` (auto-fills a name + plausible distance + offer=ask when omitted); returns the updated listing.
- `GET /resell/listings/{listing_id}` → the listing incl. its `interests` (reseller polls this for the live feed).

Register the router in `app/main.py`. Redeploy via `deploy.ps1`.

**Per-instance caveat (documented):** the listings/interests store is in-memory per Lambda instance — cross-tab works **locally (single uvicorn process, guaranteed)** and on a single warm Lambda (low-traffic demo → one instance). Not durable across cold starts/parallel instances. Acceptable for the demo; noted for MT5.

**Frontend — reuse the design system, ZERO new deps:**
- `lib/api.js`: `resellQuote(body)`, `createListing(body)`, `listings()`, `addInterest(id, body)`, `listing(id)`.
- NEW `screens/ResellConfirm.jsx` — confirm sheet: bought price, bought date, warranty left, est-value preview (from the order + a quick `/resell/quote` at default range). Continue → photo step / Cancel → back to Orders.
- Photo step: reuse `ItemIntro`'s upload pattern (`lib/image.js` downscale → `current_images` → `POST /grade`) to grade the actual uploaded photos → derives the grade used for `ai_suggested`.
- NEW `screens/ResellPrice.jsx` — a dedicated screen (the idle-lane `LiquidityScreen` stays untouched). Range selector (3/7/15 km) driving `/resell/quote` (reachable buyers, delivery cut, net) + a price slider over `price_points`. List → `POST /resell/listings`.
- NEW `screens/FlashDeals.jsx` — public board (`GET /resell/listings`); each card → **I'm interested** → `POST …/interest`. Reachable from a new Buyer tab "Flash deals near you" (public; any tab can browse → cross-tab works without login).
- NEW `screens/MyResells.jsx` — Rahul's listings with a live interested-buyers feed; polls `GET /resell/listings/{id}` (~3s interval, cleared on unmount) showing each interested buyer's name + distance + offer as they arrive.
- `App.jsx`: wire the new screens + a `resellOrder` that now routes to `ResellConfirm` (not straight to radar). The old radar/liquidity resell path remains for the SL-002 idle/notification beat (untouched) — Fix 4 is the **order-history** resell entry.

**Verify:** Orders→Resell → confirm sheet (bought price/date) → upload photos → live AI grade → suggested price → range changes net via delivery cut → list → appears on Flash deals; in a 2nd tab, tapping "I'm interested" makes the buyer appear in Rahul's My-resells live feed; every figure from an endpoint.

## Cut-from-the-bottom order (if the session runs long)
Fix 4 is the largest. Trim in this order, keeping the rest shippable:
1. Range/delivery-cut control on `/resell/quote` (fall back to a single default range; keep confirm→photo→AI price→slider→list→board→interest).
2. Cross-tab polling polish (fall back to a manual "refresh interest" button instead of auto-poll).
Never cut: the confirm sheet, photo→AI price, the flash-deals board + "I'm interested". Never touch the SL-001 spine.

## Non-goals
- No DynamoDB durability for returns/listings/interests (per-instance in-memory, like the cart).
- No real payments/escrow (demo copy only).
- No change to the SL-001 grade→route→Health Card→radar spine, the seller dashboard, or the SL-002 idle-radar/notification resell beat.

## Files touched
**Backend:** `orders.py` (window fields), NEW `returns.py` + `seed/returns_seed.json`, `size.py` (personal block) + NEW `seed/purchase_profile.json`, NEW `resell.py`, `seed/orders.json` (+2 recent orders), `main.py` (register routers). `docs/api-spec.md` + `docs/architecture.md` updated. Redeploy.
**Frontend:** `lib/api.js` (new calls + persona on sizeAdvice), `screens/BuyerStore.jsx` (return window + resell entry + Flash deals tab + My resells), `screens/Inbox.jsx` (two-section ops + /returns), `screens/Pdp.jsx` (personal block), NEW `ResellConfirm.jsx` / `ResellPrice.jsx` / `FlashDeals.jsx` / `MyResells.jsx`, `App.jsx` (wiring). Zero new deps.
