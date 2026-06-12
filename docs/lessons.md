# Lessons

One lesson per entry, newest on top, one-line summary first. Read this every fresh session. Don't duplicate what CLAUDE.md/architecture.md already record.

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
