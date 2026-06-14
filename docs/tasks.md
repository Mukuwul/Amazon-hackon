# Tasks — Amazon Second Life

Our working board for the build. One major task at a time; the ⭐ spine
(**scan → delta-grade → VRS math → Health Card → radar ping**) is the must-have core. If
something has to give, we cut from the edges, never the spine.

**Owners**
- **A** — backend (FastAPI, grading, VRS, deploy)
- **B** — frontend & demo (React console, screens, in-browser verification)
- **C** — research, PRD, and the demo video

**The iron rule:** every number on screen comes from a real API field, never hardcoded in
the UI. Features with no real computation get a seed JSON + a thin route — never fake JSX.

---

## Status at a glance

| # | Task | Owner | Status |
|---|------|-------|--------|
| MT1 | Seed store + Product Passport + Delta-Grader | A | ✅ Done |
| MT2 | VRS engine + Health Card + RTO + Radar + Pricing + deploy | A | ✅ Done |
| MT3 | Frontend spine — the demo console | B + A | ✅ Done |
| MT4 | Frontend moments + supporting screens | B | ✅ Done |
| MT5 | Bulletproof + polish + repo | A + B | ✅ Done |
| MT6 | **PRD final + demo video + submission** | **C** (A/B support) | 🔜 In progress |
| MT7 | Two-sided console — buyer hub + seller dashboard | A + B | ✅ Done |
| MT8 | Dark-store node + derived value cascade | A + B | ✅ Done |
| MT9 | Web console redesign (off the phone frame) | B + A | ✅ Done |
| MT10 | Buyer-flow fixes + resell redesign | A + B | ✅ Done |
| MT12 | Life-stage, fault attribution, returns marketplace | A + B | ✅ Done |
| MT13 | Whitish reskin (identity preserved) | B | ✅ Done |
| MT14 | Trust & the closing loop | A + B | ✅ Done |
| MT15 | Make the invisible warehouse visible | A + B | ✅ Done |

**The build is feature-complete and verified live.** What's left is submission — see MT6.

---

## What's left — MT6: PRD final + demo video + submission (C, with A/B support)

**Goal:** submitted, on time, with buffer.

- [ ] **Make the repo public** — `gh repo edit suwubh/Amazon-hackon --visibility public` (or via
      GitHub settings). Left as a deliberate manual step.
- [ ] Record the 3-minute video per [demo-and-prfaq.md](demo-and-prfaq.md) (+ a backup take).
- [ ] Map the PRD onto the official submission template, section by section.
- [ ] Export the architecture diagram for the deck.
- [ ] Dry-run the pitch once end to end.

**Done when:** the video is ≤3:00 and opens with the Priya hook, shows a live grade + VRS math
+ Health Card + radar ping; every template section is answered; submission confirmed with ≥2h
of buffer.

**Presenter notes (before recording)**
- `/metrics` is cumulative per warm Lambda instance, so it drifts up across rehearsals. For a
  clean stage number, demo on a cold instance or hit `POST /metrics/reset?token=…` once before
  the take.
- The two-person resell + buyer-confirm beat needs one warm instance and two identities (two
  browsers or incognito). It's rock-solid locally.
- The `FORCE_CACHED=1` kill switch and the committed cache floor mean a flaky network can't
  break the demo — but don't hammer the live Gemini grade right before recording (the free tier
  rate-limits under rapid calls and silently fails over to Nova; the grade is identical).

---

## The shipped build, in brief

What each task delivered. Endpoint contracts are in [api-spec.md](api-spec.md); system design
in [architecture.md](architecture.md).

**MT1–MT3 — the ⭐ spine.** Returns inbox → guided photo capture → delta-grade (day-0 vs now,
localized defects, confidence, same-unit check) → VRS recovery path (six paths, winner with
visible math) → Health Card (provenance + transferable warranty + price decay) → Idle Asset
Radar ping. Clickable end to end on the live Vercel URL against the deployed backend.

**MT4 — supporting moments.** Idle Asset Radar screen + liquidity slider, RTO sealed lane,
listing-diagnostics before/after, batch metrics view.

**MT5 — bulletproof.** A committed cache floor for every AI endpoint (`test_cache_floor.py`), a
failover drill proving Gemini → Nova → cache (`failover_drill.py`), the `FORCE_CACHED` kill
switch, and audited loading/error states. The demo cannot fail on stage.

**MT7–MT9 — the two-sided console.** Buyer storefront (shop with fit proof, cart, orders, UPI
checkout), seller return-rate dashboard with the AI-diagnosed fix, the dark-store node + the
derived value cascade, and the move off the phone frame into a real web console with live photo
upload on grading.

**MT10 / MT12 / MT14 / MT15 — depth.** Resell flow + flash-deals board with live cross-tab
interest, life-stage prediction, two-way fault attribution, graded returns onto the marketplace,
electronics → Amazon Renewed routing, the "Your Things" dormant-inventory view, and a per-persona
green ledger.

**MT13 — reskin.** A cooler, near-white Amazon-relatable surface; identity and every number
preserved (presentation only).

---

## Verify checks (the bar each task had to clear)

- **MT1:** `POST /grade` returns schema-valid JSON with localized defects, confidence, and a
  same-unit block; live and cached paths return the same shape; same item graded 3× holds its
  letter ≥2/3.
- **MT2:** every api-spec endpoint live on the deployed Function URL; `/route` on the shoe shows
  `local_p2p` winning with the hero math; sealed RTO returns `SEALED_NEW`.
- **MT3–MT4:** full click-through on Vercel against the real backend, then with `force_cached` —
  visually identical, no dead buttons on the spine.
- **MT5:** full demo on live URLs with the live model disabled → no visible difference; a
  fresh-context verifier walks the script and signs off; Lighthouse sanity.
- **Every feature task:** spine (SL-001) regression-clean (`local_p2p +₹83` vs `warehouse −₹129`),
  every new number traced to an endpoint, build clean with zero new deps; any backend change
  redeployed and re-curled on the Function URL (never trust "Done. Deployed").

---

## Human checklist (not code)

- [ ] Make the repo public (MT6).
- [ ] Record the demo video + a backup (MT6).
- [ ] Set an AWS billing alert.
- [x] Photograph the demo item set — real same-unit day-0 + current photos for the hero items.
- [x] Resolve the PRD market-stat citations (NRF/Happy Returns, Shipway, Edgistify).

---

**Reserve the final 6–8 hours exclusively for MT6.**
