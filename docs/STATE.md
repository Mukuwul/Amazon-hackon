# Project State — Amazon Second Life

## Status: Plan locked, build starting (June 13, 2026)

## Done
- ✅ PS + angle locked: Stores "Products Without a Second Chance" → Second Life (delta-grading + VRS interception + Health Card + Idle Asset Radar spine), per STEP 1 + strategic review of the master playbook
- ✅ All plan files written: CLAUDE.md (project + environment), docs/PRD.md, architecture.md, api-spec.md, tasks.md, demo-and-prfaq.md, db-setup.md, lessons.md
- ✅ Boilerplate deployed & verified (pre-hackathon): FastAPI on Lambda (ca-central-1, Function URL) + Bedrock Nova 2 Lite w/ Gemini failover + React/Tailwind on Vercel

## In Progress
- (nothing — next session starts MT1)

## Next: **MT1 — Seed store + Product Passport + Delta-Grader** (see docs/tasks.md)
Verify check: local `POST /grade` for the shoe returns schema-valid delta-grading JSON (defects + confidence + same-unit) with `source: live-bedrock`; creds removed → same shape from cache; `GET /items` lists seeds; 3× regrade gives same letter grade ≥2/3.
⚠️ Human dependency tonight: photograph the 8-item demo set (list in docs/tasks.md) — MT1 starts with 2 stock placeholders if photos aren't in yet.

## Current major task queue
MT1 → MT2 → MT3 (⭐ spine, hour-24 target) → MT4 → MT5 → MT6 (submission). One MT per session; end-of-session protocol: commit → update STATE/tasks/lessons → handoff → new session.
