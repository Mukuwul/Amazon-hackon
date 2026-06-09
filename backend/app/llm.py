"""LLM call with automatic failover.

Primary provider is tried first; if it raises (throttling, validation, network,
missing creds, etc.) it transparently falls back to the secondary provider.
Configure with env vars:
    LLM_PRIMARY   = bedrock | gemini | openai   (default: bedrock)
    LLM_FALLBACK  = bedrock | gemini | openai   (default: gemini)
Per-provider settings (region, model, keys) are read from the same .env.
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()  # read backend/.env

log = logging.getLogger("llm")

PRIMARY = os.getenv("LLM_PRIMARY", "bedrock").lower()
FALLBACK = os.getenv("LLM_FALLBACK", "gemini").lower()

AWS_REGION = os.getenv("AWS_REGION", "ca-central-1")
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "us.amazon.nova-2-lite-v1:0")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", "You are a helpful assistant for our hackathon prototype. Be concise.")


def _ask_bedrock(prompt: str) -> str:
    import boto3
    client = boto3.client("bedrock-runtime", region_name=AWS_REGION)
    resp = client.converse(
        modelId=BEDROCK_MODEL_ID,
        system=[{"text": SYSTEM_PROMPT}],
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 512, "temperature": 0.7},
    )
    # Nova 2 is a reasoning model: response may include a reasoningContent block
    # before the text block, so pull out the text block specifically.
    for part in resp["output"]["message"]["content"]:
        if "text" in part:
            return part["text"]
    raise RuntimeError("Bedrock returned no text block")


def _ask_gemini(prompt: str) -> str:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    resp = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            max_output_tokens=512,
            temperature=0.7,
        ),
    )
    return resp.text


def _ask_openai(prompt: str) -> str:
    from openai import OpenAI
    client = OpenAI()  # reads OPENAI_API_KEY
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}],
        max_tokens=512, temperature=0.7,
    )
    return resp.choices[0].message.content


_PROVIDERS = {"bedrock": _ask_bedrock, "gemini": _ask_gemini, "openai": _ask_openai}


def ask_llm(prompt: str) -> str:
    """Try the primary provider; on any failure, fall back to the secondary."""
    try:
        return _PROVIDERS[PRIMARY](prompt)
    except Exception as e:
        log.warning("Primary provider '%s' failed (%s). Falling back to '%s'.", PRIMARY, e, FALLBACK)
        if FALLBACK and FALLBACK != PRIMARY:
            try:
                return _PROVIDERS[FALLBACK](prompt)
            except Exception as e2:
                log.error("Fallback provider '%s' also failed (%s).", FALLBACK, e2)
                raise
        raise