import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from mangum import Mangum
from .llm import ask_llm
from . import grading, passport, seed

app = FastAPI(title="Amazon Second Life API")

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


class GradeIn(BaseModel):
    item_id: str = Field(..., min_length=1, max_length=20)
    force_cached: bool = False


@app.get("/items")
def items():
    return {"items": seed.list_items()}


@app.get("/items/{item_id}")
def item_detail(item_id: str):
    item = seed.get_item(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="item not found")
    return {"item": item, "passport": passport.get_events(item_id)}


@app.post("/grade")
def grade(body: GradeIn):
    try:
        return grading.grade_item(body.item_id, force_cached=body.force_cached)
    except KeyError:
        raise HTTPException(status_code=404, detail="item not found")
    except grading.CacheMiss:
        raise HTTPException(status_code=502, detail="ai_unavailable")


# Lambda entrypoint. Locally you still run: uvicorn app.main:app --reload --port 8080
handler = Mangum(app)