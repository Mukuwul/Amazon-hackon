import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from mangum import Mangum
from .llm import ask_llm

app = FastAPI(title="Amazon HackOn Starter API")

# --- CORS ---
# Handled HERE, in the app (works for both local uvicorn AND Lambda).
# IMPORTANT: keep CORS DISABLED on the Lambda Function URL, or Lambda will
# answer the OPTIONS preflight itself and bypass this config.
# Origins are read from an env var (comma-separated) so you can add one
# without a code change. Default covers local dev + your deployed frontend.
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,        # no cookies/auth, so keep this False
    allow_methods=["GET", "POST"],  # only what the API actually uses
    allow_headers=["Content-Type"],
)


class ChatIn(BaseModel):
    # Cap input length: the endpoint is public/unauthenticated, so an unbounded
    # prompt is a direct token-cost lever for abuse. 4000 chars is generous for
    # a chat turn; oversized requests get a 422 before they ever reach the LLM.
    message: str = Field(..., min_length=1, max_length=4000)


class ChatOut(BaseModel):
    reply: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatOut)
def chat(body: ChatIn):
    return ChatOut(reply=ask_llm(body.message))


# Lambda entrypoint. Locally you still run: uvicorn app.main:app --reload --port 8080
handler = Mangum(app)