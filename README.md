# Amazon HackOn 2026 — Starter Boilerplate

A deployable GenAI skeleton so day one of the hackathon starts at "build features", not "fight setup".

- **backend/** — FastAPI with `/health` and `/chat`. `/chat` calls an LLM via a swappable provider (Amazon Bedrock by default, OpenAI fallback). Edit `app/llm.py` (mostly just the system prompt) and add endpoints in `app/main.py`.
- **frontend/** — React + Tailwind v4 files(a minimal chat UI that calls the backend).



