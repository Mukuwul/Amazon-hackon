# Lessons

One lesson per entry, newest on top, one-line summary first. Read this every fresh session. Don't duplicate what CLAUDE.md/architecture.md already record.

## MT1 (June 13)
- **Deploy is blocked by IAM, not code.** The configured AWS CLI user `hackon-app` (account 656751413989) can invoke Bedrock (local grading works) but is **denied `ecr:GetAuthorizationToken`/ECR push and `lambda:UpdateFunctionCode`** → `deploy.ps1` builds fine, then fails at ECR login (400) and Lambda update (AccessDeniedException). A failed deploy changes nothing on the live function, so the demo path stays up — but **MT2 cannot ship to Lambda until `hackon-app` gets ECR-push + Lambda-deploy permissions, or deploy.ps1 is run with admin creds.** HUMAN TASK before MT2.
- **Nova-2 multimodal converse: image blocks go in `content` as `{"image": {"format": "jpeg", "source": {"bytes": <raw bytes>}}}`** (raw bytes, not base64), text block last. Worked first try in ca-central-1.
- **Grading consistency is solid at temperature=0.2**: hero shoe graded D/D/D across 3 live runs. The same-unit check is genuinely discriminative — placeholder current-photo (different shoe) correctly returned `same_unit.verified=false`; swap in real day-0-vs-now photos of the *same* unit before judging same-unit accuracy.
- **Git on Windows rewrites LF→CRLF** on these files (harmless warning); seed `.jpg`/`.json` commit fine and bake into the container via `COPY app` in the Dockerfile.

## Pre-build gotchas (carried from boilerplate phase — verified the hard way)
- **Bedrock throttles new accounts in us-east-1** → everything runs in ca-central-1.
- **Nova 2 Lite needs the inference-profile ID** `us.amazon.nova-2-lite-v1:0` (fallback `global.amazon.nova-2-lite-v1:0`), not a bare model ID.
- **Nova 2 is a reasoning model** → responses may contain a `reasoningContent` block before the text; extract the block that has `text`, never `content[0]`. Same applies to multimodal/JSON outputs.
- **Lambda container builds need `--provenance=false`** (handled in deploy.ps1); base image already has the RIC; x86_64, 512 MB, 30s timeout.
- **`load_dotenv()` must run before boto3 use locally**, else `NoCredentialsError`.
- **CORS lives in the FastAPI app only**; Function URL CORS stays disabled or it answers preflights itself.
- **Bedrock calls must be time-bounded** (connect 5s / read 15s, 2 retries) so a hung primary fails over to Gemini before the Lambda 30s timeout. Budget: with images, leave headroom — one live multimodal call + one fallback must fit in 30s.
- **Failover needs both creds present** (Bedrock via role/keys + `GEMINI_API_KEY`).
- **Don't use the full /gsd:* ceremony as the build spine** — plain task-by-task per docs/tasks.md; /gsd:debug, /code-review, /verify as point tools.
