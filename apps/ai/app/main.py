"""
Energy Localization Platform — AI / RAG service (Phase 3 / 4).

This is the Phase 1 placeholder: it boots, exposes a health endpoint, and
defines the HTTP contract the web app will call. Ingestion, retrieval, and
chat handlers are wired in Phases 3–4.
"""
from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel
from typing import Literal

from .config import settings

app = FastAPI(title="ELP AI Service", version="0.1.0")


def _require_token(auth: str | None):
    expected = f"Bearer {settings.ai_service_token}"
    if not auth or auth != expected:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token")


@app.get("/health")
async def health():
    return {"status": "ok", "phase": "1-placeholder"}


# =========================================================
# Phase 3 — Embedding / ingestion endpoints (stubs)
# =========================================================
class EmbedProductRequest(BaseModel):
    product_id: str


@app.post("/embed/product/{product_id}")
async def embed_product(product_id: str, authorization: str | None = Header(None)):
    _require_token(authorization)
    # TODO: regenerate product-card text → chunk → embed → upsert rows.
    return {"product_id": product_id, "status": "stub", "note": "implemented in Phase 3"}


# =========================================================
# Phase 4 — Chat endpoint (stub)
# =========================================================
class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str
    lang: Literal["ar", "en"] | None = None


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    citations: list[dict] = []
    note: str | None = None


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, authorization: str | None = Header(None)):
    _require_token(authorization)
    # Phase-1 placeholder: refuses to answer without retrieval, which is
    # exactly the anti-hallucination contract we'll enforce in Phase 4.
    return ChatResponse(
        session_id=req.session_id or "new",
        answer=(
            "الشات سيتم تفعيله في المرحلة 4 مع RAG و citations."
            if (req.lang or "ar") == "ar"
            else "Chat ships in Phase 4 (RAG + citations)."
        ),
        citations=[],
        note="phase-1 placeholder",
    )
