# PRD — Amazon Second Life
**HackOn with Amazon S6 · Stores track · PS: "Products Without a Second Chance"**
**Tagline: Every product finds its next best owner.**

> This file is the official submission deliverable. The 3-minute demo video follows it beat-for-beat (see docs/demo-and-prfaq.md). Stats marked `[VERIFY-C]` need a citation confirmed by C before submission — do not invent or soften them, replace with the verified figure + source.

---

## 1. The Customer

Three personas — given to us by the problem statement itself — who are the same problem wearing different clothes:

- **Priya** returns ₹500 shoes. Reverse shipping + inspection + re-listing costs more than the shoes are worth, so Amazon writes them off. Her return travels 600 km to die.
- **Rahul** has a working baby monitor in a drawer. Classifieds mean strangers, haggling, and doorstep meetups, so it stays in the drawer — while 50 parents within 5 km would buy it today.
- **A small seller** manually inspects 200 returns a month, guesses prices, and re-photographs items on his phone. The re-identification tax, 200 times over.

**The shared root cause: the cost of trust + relisting exceeds the value of the item.** Premium goods absorb that cost; the long tail can't.

## 2. The Problem, Quantified

- Nearly **$890 billion of merchandise was returned in the US alone in 2024** (NRF / Happy Returns) `[VERIFY-C: NRF 2024 returns report — note this is a US figure, say "US alone", not "global"]`.
- Indian fashion e-commerce sees **~25–40% return rates**, and COD RTO (refused/failed deliveries) runs **20–30%** in fashion `[VERIFY-C: Unicommerce / Statista / industry report]`.
- Reverse logistics in India costs **₹100–250 per item** — frequently more than the item's margin, often more than the item `[VERIFY-C]`.
- **The unit economics of the ₹500 shoe today:** reverse shipping ₹120 + inspection ₹40 + re-photograph/relist ₹60 = **₹220 of cost on a ₹150 margin** → liquidated at ~₹80 or written off. The cheapest thing Amazon can do with a ₹500 return is destroy its value.

## 3. The Insight (what makes this novel)

**Returns are not a logistics problem. They are an information-destruction problem.**

When Priya bought the shoes, Amazon already had everything: photos, specs, description, price history, demand signals, the invoice. The moment she returns them, all of that is treated as dead — the item becomes an anonymous object that must be expensively *re-identified*: re-photographed, re-described, re-priced, re-inspected. That re-identification labor is the ₹400 that exceeds the ₹500 product.

**The only genuinely new information about a returned product is its current condition.** Capture the condition *delta* in 60 seconds with a phone camera, and relisting cost collapses from ~₹400 to ~₹0. The premium-vs-cheap asymmetry disappears. No product is too cheap to save.

This is only possible for Amazon — catalog, order history, invoices, lockers, last-mile fleet, payment trust. OLX and Facebook Marketplace structurally cannot copy it. **Our moat is an architectural decision, not a feature.**

## 4. The Solution — one engine, three entry points

**The Product Passport** is the data primitive (not a feature): every product gets a persistent identity at first sale. Returns, regrades, repairs, and ownership transfers are events appended to it. Nothing is ever "relisted" because nothing was ever delisted. (Implementation: DynamoDB append-only event log. Explicitly not blockchain.)

**Surface decision:** Second Life lives *inside the existing Amazon order flow* — a layer, not an app. No new login, no new marketplace to visit. (Most teams will build a standalone app, silently reintroducing Rahul's problem.)

### The five features (How We Solve It)

**F1 — Delta-Grading with a Birth Certificate (AI Grading).**
Not zero-shot "AI, grade this shoe" (unverifiable vibes). The grader receives the **original ASIN catalog photos AND the unit's own day-0 "birth certificate" photos** alongside the current photos, and returns the *delta*: localized defects (area, severity), completeness, grade A–D, confidence, one-line justification — plus **same-unit verification** (is this the physical item we delivered?), which kills swap fraud *and* catches wardrobing (worn-then-returned). Low-confidence grades route to a human queue: we claim ~90% inspection elimination, not perfection. Demo visual: side-by-side new-vs-now with defects called out.

**F2 — Value Recovery Score + Doorstep Interception (Smart Routing).**
For every graded item, a deterministic economics engine computes expected net recovery across **six paths** — relist as-is / local P2P hop / refurbish (repair-uplift) / donate (CSR) / micro-liquidate / RTO sealed relist — and auto-picks the max, **showing its math**: *re-identification ₹0 (passport) + local hop ₹40 = net recovery +₹83 even on a heavily-worn ₹500 return, vs the warehouse round-trip −₹129 → the item survives.* The interception engine fires at two trigger points (return initiation and in-transit): if local demand exists (wishlists, notify-me, browse signals within 15 km), the pickup agent delivers the item 3–4 km away to its next buyer. **600 km becomes 4 km. The item never sees the warehouse.** Time-decay pricing guarantees a terminal state: relist → discount → donate with CSR certificate. No item sits in limbo.

**F3 — Product Health Card + Transferable Warranty (Trust Layer).**
An auto-generated trust artifact on the passport: verified condition with defect photos, full provenance (purchase date, price paid, genuine invoice), the grading report — and the badge almost nobody else can offer: **remaining manufacturer warranty transfers to the next buyer**, because Amazon holds the original invoice. A used monitor with 5 months of warranty left feels like a new purchase. The seller types nothing and can't lie. Handoff is anonymous: locker-to-locker with escrow — no addresses, no haggling, no strangers.

**F4 — Idle Asset Radar + One-Tap Resell (Supply Activation).**
Amazon's order history is a map of dormant inventory sitting in millions of homes — the world's largest warehouse, one nobody can see. We invert the marketplace: **demand activates dormant supply.** A parent searches for a baby monitor → the system finds 12 of that model bought 18+ months ago within 5 km → pings owners (opt-in): "Someone nearby will pay ₹1,800 — sell in one tap." Listing is one tap from order history: title, photos, specs, price all pre-filled from data Amazon already has. Pricing is negotiation-free via the **liquidity slider** — "₹1,400 = sold today (3 buyers waiting) · ₹1,650 = ~1 week" — the seller picks speed, not price.

**F5 — Prevention + the RTO Sealed Lane (Best return = no return).**
- **Listing diagnostics:** a seller's 200 "doesn't match" returns are a *diagnosis*, not 200 events. AI compares listing photos vs graded-return photos ("your photos show navy; returned units photograph royal blue") and **auto-patches the listing** — projected ~40% return reduction on diagnosed SKUs.
- **Size passport** (PDP widget): "In Nike you're an 8; in this brand, 23% of buyers with your profile returned the 8 — take the 8.5."
- **RTO Sealed Lane:** India's biggest reverse-logistics bleed is COD refusals — sealed, brand-new packages already sitting in the buyer's city. Agent photographs the intact seal → AI verifies → item auto-grades "Sealed/New" → re-offered to local demand same-day. *The cheapest return to process is one that was never opened.*

### User workflow (3 steps)

**Scan → Route → Rehome.** Customer (or agent) captures guided photos at the point of return → delta-grade + same-unit check in ~2s → VRS routes to highest-recovery path → Health Card publishes → local buyer collects via locker/agent hop. The buyer meets the item as one row on the normal PDP: *"Second Life options near you: Grade A · ₹310 · 4 km · delivery today."*

## 5. Success Metrics (tied to Amazon business value)

| Metric | Today (baseline) | With Second Life |
|---|---|---|
| **Net Recovery per Return** (₹, on the ₹500 reference item, graded D) | −₹129 (warehouse round-trip) | **+₹83** (local hop) |
| **Recovery Rate** (₹ recovered / ₹ MRP, long-tail returns) | ~10–15% (bulk liquidation) | **50–60%** |
| **Warehouse Bypass Rate** (% resellable returns never entering an FC) | 0% | **40%+** |
| **Time-to-Relist** | ~30 min human effort | **< 2 min, zero clicks** (shadow listing) |
| **Return rate on diagnosed listings** | baseline | **−40%** on "doesn't match" SKUs |
| **Dormant-Asset Activation** (radar pings → listings) | n/a (supply waits for sellers) | new supply line, day one |
| **Sustainability** | landfill/liquidation | **kg CO₂ + kg landfill diverted per item**, logged per passport event |

**Business model in one line:** Amazon takes a 10–15% take-rate on every rupee of recovered value — we only earn when value is saved. Plus ESG/EPR compliance revenue (brands are legally required to recycle a share of what they sell; passports make diversion auditable).

## 6. Architecture (summary — full detail in docs/architecture.md)

React (phone-frame, inside-the-order-flow UI) on Vercel → FastAPI on AWS Lambda → a **multimodal vision model** (Gemini 2.5 Flash primary, **Amazon Bedrock Nova 2 Lite** as the AWS-native failover — provider-agnostic, the LLM is a swappable perception layer) for delta-grading / seal-check / listing diagnostics → deterministic VRS economics engine (pure Python — the LLM is a perception layer, the money math is auditable code) → DynamoDB passport event log (append-only) + S3 for images. Production pipeline: S3 upload → EventBridge → Step Functions (grade → route → list) → DynamoDB; confidence-threshold routing sends low-confidence grades to a human review queue. Serverless = the scaling answer writes itself.

**Key algorithms:** delta-grading prompt with per-ASIN rubric and JSON-constrained output · VRS = argmax over six expected-recovery functions · time-decay pricing with guaranteed terminal state · demand-matching over geo-indexed order history · confidence-threshold routing.

## 7. Roadmap & Futuristic Vision

- **0–3 months:** fashion pilot (highest return rates) — doorstep delta-grading + interception in 2 metros; RTO Sealed Lane for COD refusals.
- **3–6 months:** electronics + transferable warranty at scale; locker-to-locker P2P; listing diagnostics for all 3P sellers.
- **6–12 months:** **resale value at checkout** ("Buy at ₹2,400 · we'll rebuy at ~₹1,500 within 12 months → effective cost ₹900") — circular economy as a purchase feature that *increases* new-sale conversion; Grow Cycle subscriptions for outgrowable categories; micro-liquidation bidding for kiranas; **brand layer** (right of first refusal on their own returns, trade-in boosts); dynamic return windows ("60-day returns on this item because we can resell it in your city in 6 hours"); Green Ledger ESG/EPR revenue.
- **Multi-segment expansion:** fashion → electronics → furniture → B2B liquidation → textbooks/edu → healthcare equipment. Geography-agnostic by design.

## 8. "Doesn't Amazon already do this?" (pre-empted)

- **Amazon Renewed / Warehouse Deals:** proves demand exists — but warehouse-bound, human-graded, premium-skewed, and a separate storefront nobody visits. We fix the supply economics it structurally can't reach, and surface it on the normal PDP.
- **FBA Grade and Resell:** the item still travels to the FC and a human still grades it. We grade at the source and delete the trip.
- **Returnless refunds:** Amazon already abandons low-value items — and the value dies in a drawer. We recover it with the local handoff. The novel part is the handoff, not the refund.

## 9. Non-Goals (48h scope control)

- No standalone app or login — everything renders inside a mocked Amazon order/PDP flow.
- No real payments, escrow, or logistics integration — escrow/locker states are mocked screens.
- No behavioral surveillance for return prediction (creepy framing; grade-then-decide achieves the outcome with consent).
- No two-size send (doubles forward logistics; industry tried and retired it).
- No blockchain. No live un-curated grading on stage.

## 10. Theme alignment

Maps 1:1 to the PS's four challenge bullets: **AI Grading** (F1, <2s/item) · **Smart Routing** (F2, millisecond decision across resell/refurbish/P2P/donate) · **Trust Layer** (F3, the Product Health Card verbatim) · **Prevention** (F5, "best return = no return"). The demo shows the PS's own equation — *Cost > Value = Written off* — being defeated in real time.
