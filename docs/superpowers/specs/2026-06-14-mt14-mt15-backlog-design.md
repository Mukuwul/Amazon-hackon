# MT14 + MT15 — Playbook backlog, split into two sessions (design)

Date: 2026-06-14 · Decided in a brainstorm this session. Source: the user's playbook/strategic-review cross-check (a large batch of features + four current-implementation fixes). The batch is too big for one pass, so it splits into **two thematic MTs the user runs in separate sessions**, plus a docs-only roadmap bucket. Each MT protects the SL-001 spine, holds the iron rule (every on-screen number API-backed), redeploys + curl-verifies the backend, and ends with docs updated.

## Verification done first (what already exists)
Checked the repo before scoping — nothing here is a duplicate except:
- **Life-stage prediction (§6.3)** is **already built** (MT12): `lifestage.py`, `GET /life-stage/{asin}?persona=`, `seed/lifestage_curves.json`; the monitor notification renders months-owned + ₹/month from it. Not re-built; reused.
- **Returns → Flash deals** path **exists but is buggy**: `resell.list_from_route()` + `POST /resell/from-route/{id}` + `FlashDeals.jsx` are all present. The frontend only fires it on `origin==="ops" && r.decision==="local_p2p"` via a *separate* POST (`App.jsx:246`) that can miss the listing (per-instance store, or the graded return doesn't win local_p2p). → fixed in MT14.
- **Green Ledger counter** exists in `metrics.py` (CO₂/landfill/inspection + take-rate). The **per-persona** view does not → built subtle in MT15.

## Decisions locked (user)
1. **Electronics route to a "Renewed (certified)" channel**, not quick-commerce (Amazon Now). Gated by the Health Card + a seeded usage line (battery-cycle count). Quick-commerce stays for fast-moving everyday goods (shoe, kurta). **Also: when an item is *not* quick-commerce eligible, the route card shows its best VRS path** (Renewed for electronics; the winner otherwise).
2. **Split by theme:** MT14 = Trust & the closing loop; MT15 = make the invisible warehouse visible.
3. **Roadmap items are docs-only** (PRD §7 + architecture). No UI gestures, no roadmap screen.
4. Several items the user re-tagged **roadmap instead of build** during this brainstorm (see each MT).

## MT14 — Trust & the closing loop
Theme: prove the grade is trustworthy and close the buyer-facing loop.

**Build:**
- **Resell sold → buyer "order confirmed" (fix-1).** When the reseller accepts an interested buyer (`resell.sell_to_interest`, already built), the *buyer* side gets an "Order confirmed" notification + a small popup. Thin: surface accepted-interest status to the buyer view; frontend popup/toast. No new economics.
- **Returns → Flash deals fix (fix-4).** Diagnose with systematic-debugging, then make `/route` create the board listing **server-side** (atomic with the ROUTED event, on the same instance) instead of the fragile frontend `origin==="ops"` POST. Drop or keep the frontend POST as a harmless no-op. *Verify a graded return that wins local_p2p appears on the board with the "Returned · Grade X" badge — the thing the user reported broken.*
- **Electronics order + Renewed routing (fix-2 + fix-3).** Add an electronics item to `seed/orders.json → rahul_order_history`; on resell/return it routes to **Amazon Renewed (certified)**, not Amazon Now. Thin backend in `vrs.build_paths` (`vrs.py:105-110`): gate the `dark_store` (quick-commerce) attachment by category, add `quick_commerce_eligible` to the route + a `renewed_channel` descriptor (seed-backed) for electronics; seed a battery-cycle line on the Health Card as the trust hook. Frontend `RouteScreen`: non-electronics local_p2p shows "Moved to quick commerce · Amazon Now · {dark store}"; an item that's *not* quick-commerce eligible shows its **best path** instead (electronics → "Amazon Renewed (certified)").

**Docs-only roadmap (PRD §7 + architecture):** #1 Buyer-verified closing loop §3.6 (the "Yes, condition matches Grade X → ₹15 credit, audited by a human on every sale" loop — strong, deferred to roadmap), #10 Review-informed inspection checklists §18.2, #2 Agent-as-grader / Agent Flip §3.3 §4.3, #12 Usage-data certification §5.3.

## MT15 — Make the invisible warehouse visible
Theme: surface and activate idle inventory in people's homes, from the owner's side.

**Build:**
- **"Your Things" dormant-value dashboard (#9 §18.3).** `GET /your-things/{persona}` → every order with a live resale value (via `pricing.resale_value` + age + the built life-stage curve) and a total ("your home holds ₹X in dormant value"). New `YourThings` buyer screen → per-item Resell CTA into the existing resell flow. *Cut in MT4 only because no endpoint backed it — now it does, so the iron rule holds.*
- **Personal Green Ledger (#6 §8.5).** `GET /green-ledger/{persona}` → that persona's own CO₂/landfill/items-diverted, derived from their passport events (reuses `metrics.py` math, scoped per persona). Shown **subtly on both the buyer side (Your Things) and the seller dashboard** — a small ledger strip, not a hero panel.

**Docs-only roadmap (PRD §7 + architecture):** #3 Hidden QR resale + gift-transfer §2 §18 (QR → prefilled resale; recipient scans → passport ownership transfers; the school-textbook + life-stage nudge is the cheapest slice to pull forward later, but deferred per the user), #4 Brand layer §18.5 (right-of-first-refusal + trade-in boost on the seller dash — re-tagged roadmap, no build), #8 Pickup piggybacking §8.4, #9 Season-aware routing §8.6, #14 Material-stream routing §18.7, Grow Cycle subscription §7.2, Micro-liquidation bidding §4.7.

## Explicitly NOT built (respecting the user's re-tags)
- Buyer-verified closing loop (#1) — roadmap.
- QR resale + gift transfer + textbook nudge (#3) — roadmap.
- Brand layer on seller dashboard (#4) — roadmap.

## Sequencing
Run **MT14 → MT15 → MT5 → MT6**. Both new MTs land before MT5 so the bulletproof + loading/error-state pass covers the new surfaces (the buyer-confirm popup, the server-side return-listing, the electronics Renewed card, Your Things, the per-persona green ledger). Neither touches the locked spine.

## Verify (per MT)
Each MT is done when: every new number traces to an endpoint (curl each new route against the Function URL first — never trust "Done. Deployed", per lessons.md); spine (SL-001) regression-clean (`local_p2p +₹83` vs `warehouse −₹129`); build clean, zero new deps; any backend change redeployed via `deploy.ps1` and re-curled; UI walked via chrome-devtools on localhost AND the live Vercel URL; PRD §7 + architecture updated with that MT's roadmap entries; STATE.md + lessons.md updated.
