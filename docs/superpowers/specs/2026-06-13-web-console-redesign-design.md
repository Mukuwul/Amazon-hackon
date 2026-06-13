# MT9 — Web console redesign (de-phone the demo)

**Date:** 2026-06-13 · **Status:** approved, ready to build (next session) · **Owner:** B (frontend) + A (thin backend)

## Why

The demo works but is hard to read on stage: everything lives inside a single 390px
**phone frame**, and the persona/flow navigation is dense. The ask is a **presentation
change, not a feature change** — make it a real web console so a judge instantly
understands it. Almost every feature already exists (the grade→route→health-card→radar
spine, the size-proof PDP, the seller return dashboard, the resell→radar flow). MT9
re-houses them as web pages and adds two genuinely new pieces: **photo upload on the
grading page** and a fleshed-out **buyer storefront**.

## Decisions locked (from the brainstorm, 2026-06-13)

1. **UI first, MT8 after.** Build the web redesign now; MT8 (dark-store node + derived
   cascade strip) slots into the web `RouteScreen` in a later session. Rationale: don't
   build MT8 into a phone layout we're about to delete. This spec updates the MT8 entry
   so the next session isn't confused.
2. **Hybrid photo upload.** The grading page accepts uploaded current-state photos and
   grades the *actual uploaded photos* live (Nova-2 → Gemini → cached floor). No upload →
   falls back to the seeded current photos, so the demo always works.
3. **All API-backed.** Cart, notifications, orders, and the UPI checkout step are backed
   by thin seed-JSON endpoints — the iron rule ("every number on screen comes from the
   API, not hardcoded JSX") holds. Survives a judge opening the network tab.
4. **One MT9.** Cohesive reshell; build order protects the ⭐ spine, edges cut from the
   bottom if time runs short.

## Approach — evolve in place (NOT a rebuild)

Swap the `PhoneFrame` device shell for a web shell, widen each screen from the fixed
390px column to a responsive page, add the new buyer-storefront areas + the grading
two-pane, and **keep** the `App.jsx` state machine, the `lib/api.js` client, the Tailwind
`@theme` design tokens, the CSS animations, and **all backend logic**. Zero new deps.
The ⭐ spine (scan → delta-grade → VRS → Health Card → radar ping) is protected and must
stay regression-clean.

*Rejected:* a from-scratch React-router rebuild (throws away working screens, risks the
spine, adds deps); keeping the phone frame only for grading (user wants web throughout).

## Section 1 — Shell + homepage

- **New `WebShell`** replaces `PhoneFrame`: a thin Amazon-navy top bar (logo + "Second
  Life" leaf + visual search box + bell + cart count) over a centered responsive content
  column (≈`max-w-6xl`, comfortable gutters). Retire the `.phone` / `.phone-screen` CSS;
  `screen-scroll` (height:100% inner scroll) becomes normal page scroll.
- **Homepage = the existing `Home.jsx` three-card concept, de-phoned.** Same three options
  (Returns desk = "start here" · Rahul/Buyer · Vastram/Seller) + the
  Prevent·Recover·Recirculate identity band, re-laid as a web landing grid (cards side by
  side on desktop, stack on mobile). No new homepage concept — reskin only.
- Responsive: web layout on desktop; the existing mobile breakpoint behavior (full-bleed)
  is preserved so it still reads on a phone-width viewport.

## Section 2 — Returns desk (AI-grading + the spine)

Framed as the **delivery agent's scan station** (the agent scans at handoff, not the
customer — the customer may reuse the item).

- **`ItemIntro` → two-pane page:**
  - **Left:** catalog + day-0 thumbnails of the unit (the baseline the AI compares against).
  - **Right:** an **upload dropzone** (drag/drop or file pick) + thumbnails of the
    uploaded current photos + a **"Run AI grade"** button.
- **Upload = hybrid (`/grade` change):** the chosen photos are sent to `/grade`; the
  backend grades the *actual uploaded* current photos (catalog + day-0 still from seed as
  the baseline). Nova-2 → Gemini → cached floor unchanged. **No upload → seeded current
  photos** (current behavior), so the flow never blocks.
- **Downstream screens reused + widened, logic untouched:** `Grade` (the side-by-side
  day-0-vs-now comparison gets more room on web — a real readability win), `RouteScreen`
  (VRS 6-path money math), `HealthCard`, `RadarScreen` / `LiquidityScreen`, `SealLane`,
  `DiagnoseScreen`, `MetricsScreen`. **This is the protected spine.**

## Section 3 — Buyer storefront (Rahul) — all API-backed

A storefront web page with four areas (tabs or sections): **Shop · Cart · Orders ·
Notifications**, styled Amazon-like.

- **Shop** — product grid from `/items` → tap → **PDP** (reuse `Pdp.jsx`: size social
  proof from `/size-advice/{asin}` + resale hint), widened to a web product page. Add-to-cart
  → `POST /cart/rahul`.
- **Cart** — `GET /cart/rahul`: seeded lines (e.g. the shoe in the *recommended* size the
  fit-proof suggests), qty, line totals, cart total (computed server-side). "Buy" →
  **UPI checkout**: `POST /checkout/rahul` returns a pending UPI collect request
  (`order_id`, `amount`, `upi_vpa`); the page shows an "Approve the payment in your UPI app"
  card; confirm → success state (single endpoint with an optional `confirm` step, or a thin
  `/confirm` — builder's call, but keep it API-returned).
- **Orders** — existing `GET /orders/rahul`; each row **Return** / **Resell**. One-tap
  Resell on the idle monitor → existing `RadarScreen` → `LiquidityScreen` → ping (unchanged).
- **Notifications** — `GET /notifications/rahul`: the hero nudge "Your baby monitor — N
  buyers searching nearby. Resell?" (references SL-002 / `B0MONITOR1`) → tap → the existing
  radar→liquidity resell flow. A couple of filler notifications (delivery/price-drop) for
  realism, also from the endpoint.

## Section 4 — Seller dashboard (Vastram) — reskin to webpage

- `SellerDashboard` → a wide **return-rate table** (worst-first: SKU, units sold, returns,
  return-rate %, top reason), from the existing `GET /seller/returns`. Tap a high-return SKU
  → `DiagnoseScreen` drill-down (existing `/diagnose-listing`: reasons + navy→royal swatch
  fix + −40% projected drop). Same data, web table instead of a phone list.

## Section 5 — Backend deltas (one redeploy via `deploy.ps1`)

- **`/grade` accepts uploaded current images.** `GradeIn` gains optional
  `current_images: list[str]` (base64, **no** `data:` prefix or strip it server-side).
  `grading.grade_item(item_id, force_cached, current_images=None)` →
  `_grade_live(item, current_override)`: when provided, decode and use those bytes as the
  **current** set; still read catalog + day-0 from seed; recompute the prompt image counts.
  No override → seeded current photos (today's path). Caps to bound public-endpoint abuse +
  the Lambda Function URL 6 MB request limit: **≤3 images, ≤~1.5 MB each decoded**; the
  frontend should **downscale to ~1024px / ~300 KB before sending**. Reject oversize with 422.
- **New `buyer.py` + `seed/buyer.json`** (per-persona `{cart, notifications}`):
  - `GET /cart/{persona}` → `{persona, lines:[...], total}`
  - `POST /cart/{persona}` → append a line (in-memory, mirrors the per-instance passport
    pattern; cold start resets to the seed — fine for demo)
  - `GET /notifications/{persona}` → `{persona, notifications:[...]}`
  - `POST /checkout/{persona}` → `{order_id, amount, upi_vpa, status:"pending"}`; a confirm
    step returns `status:"success"`.
- Register routers in `app/main.py`; **redeploy** (Docker up). **Document the new endpoints +
  the `/grade` `current_images` field in `docs/api-spec.md` and `docs/architecture.md` as
  part of the build** (same convention as MT7/MT8).

## Frontend deltas (reuse MT3 design system, ZERO new deps)

- New `WebShell` (replaces `PhoneFrame`); `index.css` loses the phone shell, gains web
  layout utilities.
- `Home` reskinned to a web landing; `ItemIntro` → two-pane + upload; new `BuyerStore`
  (Shop/Cart/Orders/Notifications) + `Checkout` (UPI) screens; `SellerDashboard` → table.
  Reuse `Grade`, `RouteScreen`, `HealthCard`, `RadarScreen`, `LiquidityScreen`, `SealLane`,
  `DiagnoseScreen`, `MetricsScreen`, `Pdp`.
- `lib/api.js`: `grade(id, forceCached, currentImages)`, `cart(persona)`, `addToCart(...)`,
  `notifications(persona)`, `checkout(...)`. Keep the existing `*Safe` cold-start wrappers.
- Optional UI/UX polish (buttons, hover, page transitions) is welcome where it reads
  better on web — but never at the spine's expense.

## Build order (spine first; cut from the bottom)

1. Shell + homepage (WebShell, de-phone, web landing) → demo launches.
2. Returns-desk two-pane + upload hybrid + widen the spine screens (grade→route→card→radar).
3. Buyer storefront (Shop/PDP/Orders first; then Cart/Checkout/Notifications).
4. Seller table reskin.
5. UI/UX polish.

**Cut-from-bottom if time runs short:** checkout depth + notification variety + polish,
*before* anything on the spine.

## Verify (done when)

- Homepage (3 options) → each of the three sections reachable with no dead ends, on the
  live Vercel URL against the deployed backend.
- Returns desk: upload current photos → live grade of the *uploaded* photos (network tab
  shows `current_images` in the `/grade` body) → route → health card → radar ping. No
  upload → seeded grade still works. **Spine (SL-001) regression-clean.**
- Buyer: Shop → PDP size proof → add to cart → cart shows the line → checkout → UPI
  "approve" → success; Orders resell → radar/liquidity → ping; Notifications nudge → resell.
  Every figure traces to an endpoint (curl each new route first).
- Seller: return-rate table → tap high-return SKU → diagnose drill-down.
- Build clean, **zero new deps**; walked via chrome-devtools on localhost AND the live
  Vercel URL; new endpoints + the `/grade` field documented in api-spec.md + architecture.md.

## MT8 note (update its tasks.md entry)

MT8 now runs **after** MT9. Its cascade strip + dark-store label render in the **web**
`RouteScreen`, not a phone frame. Otherwise MT8's scope (derived cascade via VRS argmax
over −5%/wk decay, `seed/dark_stores.json`, `GET /cascade/{item_id}`) is unchanged.

## Non-goals

- No backend economics changes (VRS, pricing, grading rubric untouched).
- No real payment integration — the UPI step is a demo confirmation, just API-returned.
- No auth / multi-user; personas stay seeded.
- MT8's cascade is NOT built here.

## Risks

- **Reshell regressions on the spine** — mitigate by doing the spine screens first and
  re-walking SL-001 end-to-end after the shell swap.
- **Upload payload size** — mitigate by client-side downscale + server cap (≤3 imgs).
- **Scope creep** — the storefront is the most cuttable; hold the spine.
