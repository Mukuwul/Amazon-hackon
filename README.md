# Amazon Second Life

**Every product finds its next best owner.**

An intelligent layer *inside* the Amazon order flow that gives returned, unused, and
outgrown products a second life instead of a one-way trip to a warehouse or landfill.
Built for **HackOn with Amazon — Season 6**.

**Live demo:** https://amazon-hackon.vercel.app
**API (AWS Lambda Function URL):** https://ahwfmhaqed45p5xxk2u663oi6m0mejgi.lambda-url.ca-central-1.on.aws

---

## The problem

Stores track "Products Without a Second Chance" — items that get returned, sit idle, or
are outgrown and never re-enter circulation. Today a return defaults to a reverse trip to
a distant warehouse: expensive, slow, and often ending in write-off. Most of the value, and
most of the trust, is lost on the way.

## What it does — the ⭐ spine

1. **Scan & delta-grade.** A returns agent uploads the unit's *current* photos. A multimodal
   vision model grades them **against that unit's own day-0 "birth-certificate" photos** — so
   the score is about real wear on *this* unit, not a generic catalog image. A same-unit trust
   gate flags anything that isn't the unit that was delivered.
2. **Value Recovery Score (VRS).** A deterministic Python engine prices six recovery paths
   (local P2P, warehouse relist, refurbish, liquidate, donate, RTO relist), nets each against
   its real costs, and routes the item to its highest-rupee path. Local interception usually
   beats the warehouse round-trip.
3. **Product Health Card.** A transferable trust record — provenance, the AI grade report,
   remaining transferable warranty, and a price-decay curve — that travels with the item.
4. **Idle Asset Radar.** Activates dormant inventory sitting in people's homes by matching it
   to live local demand, and surfaces a "Your Things" dormant-value view + a personal green ledger.

**Design rule:** the LLM is a *perception layer only*. Every rupee on screen comes from
deterministic Python and a real API field — never hardcoded JSX — so a judge can open the
network tab and audit the math.

## Architecture

```
React 19 + Tailwind v4 (Vite)  ──►  FastAPI on AWS Lambda (container, ca-central-1,
   on Vercel                          Function URL) + Mangum
                                         │
                                         ├─ Perception: Gemini 2.5 Flash (primary)
                                         │              → Bedrock Nova 2 Lite (failover)
                                         │              → committed cached response
                                         ├─ Money math: deterministic Python (VRS, pricing)
                                         └─ Product Passport: DynamoDB event log
                                            (behind DYNAMODB_TABLE_NAME; in-memory fallback)
```

- **Provider-agnostic perception.** Primary/fallback are env-driven (`LLM_PRIMARY`/`LLM_FALLBACK`).
  Gemini Flash has free-tier headroom; Nova 2 Lite on AWS credits is the always-available backstop.
- **Demo never blocks.** Repo-baked seed items + cached AI responses, and a `FORCE_CACHED=1`
  kill switch, mean a failed live call on stage is invisible. A DynamoDB outage degrades to an
  in-memory store. See `docs/architecture.md`.

## Run it locally

**Backend** (Python 3.11+):
```bash
cd backend
pip install -r requirements.txt
# create .env from .env.example (GEMINI_API_KEY, AWS creds for Bedrock failover, etc.)
uvicorn app.main:app --reload --port 8080
```

**Frontend** (Node 18+):
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173  (must be localhost, not 127.0.0.1 — CORS is origin-exact)
```
`frontend/.env.local` can point `VITE_API_URL` at a local backend; it defaults to the deployed
Function URL, so the frontend runs against prod with no local backend.

## Deploy

- **Frontend** auto-deploys to Vercel on `git push origin main`.
- **Backend** — `cd backend; ./deploy.ps1` (Docker must be running) builds the container, pushes
  to ECR, and updates the Lambda. See `docs/lessons.md` for the ECR cred-helper note.

## Key environment variables (backend)

| Var | Purpose |
|-----|---------|
| `LLM_PRIMARY` / `LLM_FALLBACK` | provider chain (`gemini` / `bedrock`) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini perception (`gemini-2.5-flash`) |
| `BEDROCK_MODEL_ID`, `AWS_REGION` | Bedrock Nova failover |
| `DYNAMODB_TABLE_NAME` | enable the persistent passport + demo stores (optional) |
| `ALLOWED_ORIGINS` | CORS allowlist (defaults to localhost + the Vercel app) |
| `FORCE_CACHED` | `1` → serve only cached AI responses (stage kill switch) |
| `ENABLE_CHAT` | `1` → re-enable the legacy `/chat` endpoint (off by default) |
| `METRICS_RESET_TOKEN` | token to gate `POST /metrics/reset` (presenter tool) |

## Repo layout

```
backend/app/    FastAPI app — grading, vrs, pricing, healthcard, radar, inspection,
                resell, returns, buyer, your_things, green_ledger, store (DynamoDB), …
backend/tests/  VRS reconciliation + hero golden test
frontend/src/   React screens (the demo console) + lib/api.js
docs/           PRD, architecture, api-spec, tasks, lessons, demo script
```

## Documentation

- `docs/PRD.md` — the submission deliverable
- `docs/architecture.md` — system design, VRS math, GenAI core, failover/seed path
- `docs/api-spec.md` — every endpoint
- `docs/demo-and-prfaq.md` — 3-minute demo beat sheet + jury Q&A
