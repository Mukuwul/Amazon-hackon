# Project State — Amazon Second Life

## Status: MT1 done & verified locally (June 13, 2026)

## Done
- ✅ PS + angle locked: Stores "Products Without a Second Chance" → Second Life (delta-grading + VRS interception + Health Card + Idle Asset Radar spine), per STEP 1 + strategic review of the master playbook
- ✅ All plan files written: CLAUDE.md (project + environment), docs/PRD.md, architecture.md, api-spec.md, tasks.md, demo-and-prfaq.md, db-setup.md, lessons.md
- ✅ Boilerplate deployed & verified (pre-hackathon): FastAPI on Lambda (ca-central-1, Function URL) + Bedrock Nova 2 Lite w/ Gemini failover + React/Tailwind on Vercel
- ✅ **MT1 — Seed store + Product Passport + Delta-Grader** (commit `be97d15`). Local-verified, fresh verifier signed off. Built: `seed/` (8 items + orders + neighbors JSON, placeholder images for SL-001 shoe & SL-002 monitor, cached grades), `passport.py` (in-memory event log + DynamoDB write-through behind flag), `grading.py` (Nova-2 multimodal delta-grader, Pydantic schema, retry-on-bad-JSON, Bedrock→Gemini→cache), `llm.py` `ask_llm_images()`, endpoints `GET /items`, `GET /items/{id}`, `POST /grade`, `scripts/capture_cache.py`. Hero shoe grades **D/D/D** across 3 live runs (consistency ✅); creds-broken server returns identical shape with `source:cached` ✅.

## In Progress
- (nothing — MT1 closed; next session starts MT2)

## ⚠️ BLOCKER for MT2 (human task): AWS deploy permissions
The configured CLI user `hackon-app` can invoke Bedrock but is **denied ECR push + `lambda:UpdateFunctionCode`** → `deploy.ps1` builds OK then fails at push/update (the live Lambda was NOT changed, still runs boilerplate, /health OK). **Before MT2 ships: attach ECR-push + Lambda-deploy permissions to `hackon-app`, or run `deploy.ps1` with admin creds.** See docs/lessons.md. The deployed Function URL `/items` returns 404 until MT2 deploys the new code — this is expected.

## Next: **MT2 — VRS engine + Health Card + RTO + Radar + Pricing + deploy** (see docs/tasks.md)
Verify check: all api-spec curls pass against the **deployed** Function URL; `/route` on the shoe shows `local_p2p` winner with hero math; `/seal-check` SL-004 → `SEALED_NEW`; cached fallback verified post-deploy. (Deploy depends on the blocker above.)
Also still open: real demo photos to replace the 2 placeholder items (current SL-001/SL-002 use Wikimedia Commons placeholders; SL-003..008 have metadata but no images yet → their `/grade` returns 502 until photos + cache land).

## Current major task queue
MT1 ✅ → MT2 → MT3 (⭐ spine, hour-24 target) → MT4 → MT5 → MT6 (submission). One MT per session; end-of-session protocol: commit → update STATE/tasks/lessons → handoff → new session.
