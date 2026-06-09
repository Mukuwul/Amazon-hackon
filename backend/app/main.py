from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum
from .llm import ask_llm

app = FastAPI(title="Amazon HackOn Starter API")

# Browser calls. Tighten to your frontend URL before the demo if you like.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatIn(BaseModel):
    message: str


class ChatOut(BaseModel):
    reply: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatOut)
def chat(body: ChatIn):
    return ChatOut(reply=ask_llm(body.message))


# Lambda entrypoint — AWS calls this. Locally you still run uvicorn app.main:app
handler = Mangum(app)
