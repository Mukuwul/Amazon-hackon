# Amazon Second Life — HackOn with Amazon S6

## What this is
**Amazon Second Life** ("every product finds its next best owner") — an intelligent bridge for returned/unused/outgrown products. AI delta-grades items against their own day-0 photos + catalog, a deterministic Value Recovery Score routes each item to its highest-rupee path (local P2P interception beats the warehouse), a Product Health Card with transferable warranty creates trust, and the Idle Asset Radar activates dormant inventory in people's homes. PS: Stores track, "Products Without a Second Chance". Deliverable: PRD (docs/PRD.md) + 3-min demo video + deployed prototype.

## Stack (LOCKED)
- Frontend: React 19 + Tailwind v4 (Vite) on Vercel — phone-frame, inside-the-Amazon-order-flow UI (a layer, not an app)
- Backend: FastAPI on AWS Lambda (container/ECR, ca-central-1, Function URL) + Mangum — already deployed, redeploy via `backend/deploy.ps1`
- GenAI: Gemini 2.5 Flash multimodal primary, Bedrock Nova 2 Lite (`us.amazon.nova-2-lite-v1:0`) failover (both vision-capable; provider-agnostic via `LLM_PRIMARY`/`LLM_FALLBACK` — Gemini Flash has free-tier headroom, Nova on AWS credits is the always-available backstop); LLM = perception layer, money math = deterministic Python
- DB: DynamoDB passport event log behind `DYNAMODB_TABLE_NAME` env flag; in-memory JSON-seeded fallback — demo never blocks on it (docs/db-setup.md)
- Demo safety: repo-baked seed items + cached AI responses; a failed live call on stage is invisible

## Rules
- All documentation goes in /docs
- Update docs/STATE.md after every major change
- When starting a new session, read this file, docs/STATE.md, docs/tasks.md, and docs/lessons.md first
- One MAJOR TASK (docs/tasks.md) per session; end every session: commit → update STATE/tasks/lessons → plain-English handoff → tell the user to start a new session
- Never end a turn on "I'll now do X" mid-task — do X
- Protect the ⭐ spine (scan → delta-grade → VRS math → Health Card → radar ping); cut from the edges, never the spine
- Every number shown in the UI must come from the API, not hardcoded JSX
- Report only verified results; state what's verified vs not

## Docs structure
- docs/STATE.md         → Done / In Progress / Next + current major task (cross-session memory)
- docs/PRD.md           → THE submission deliverable (demo video follows it)
- docs/architecture.md  → system design, GenAI core/prompts, VRS math, seed/fallback path, Mermaid
- docs/api-spec.md      → every endpoint (method, request, response, errors)
- docs/tasks.md         → MAJOR TASKS MT1–MT6 with owners + verify checks (live source of truth)
- docs/demo-and-prfaq.md→ 3-min video beat sheet + jury Q&A pocket answers
- docs/db-setup.md      → optional DynamoDB setup (placeholders user fills)
- docs/lessons.md       → one gotcha per entry; read each session to avoid repeats

## ENVIRONMENT (tooling — read once per session, use what adds value)
- **Skills:** superpowers (brainstorming, systematic-debugging, TDD, verification-before-completion, code-review req/recv, writing-clearly-and-concisely); design: frontend-design, ui-ux-pro-max, minimalist-ui, high-end-visual-design, impeccable (use in MT3/MT4); docs: prd; engineering: senior-backend, senior-frontend, aws-solution-architect, database-designer, rag-architect, performance-profiler
- **Built-in:** /code-review, /simplify, /verify, /security-review, /commit — use /verify + a fresh verifier subagent at each MT's verify check
- **MCP:** context7 (library docs — prefer over web search), playwright + chrome-devtools (verify the live demo flows, MT3/MT5), magic/21st.dev (UI components), Vercel (deploy/env)
- **Subagents:** Explore (codebase questions), Plan, code-simplifier; fresh-context verifier > self-critique
- **GSD:** do NOT run the /gsd:* ceremony as the build spine; /gsd:debug as point tool only
- **Commands:** backend local `uvicorn app.main:app --reload --port 8080` · frontend `npm run dev` · backend redeploy `cd backend; ./deploy.ps1` (Docker must be running) · frontend deploys on `git push`
- **Secrets:** `.env` files, gitignored; Lambda uses execution role for Bedrock + `GEMINI_API_KEY` env

## Current phase
See docs/STATE.md

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
