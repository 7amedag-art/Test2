# ELP AI service

FastAPI service that handles embeddings, retrieval, and RAG chat for the
Energy Localization Platform. **Phase 1 status:** placeholder only — boots,
authenticates, exposes the contract the web app will call.

## Run locally

```bash
cd apps/ai
python -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health`.

## Phase plan

- **Phase 3** — `/embed/product/{id}` generates product-card text, chunks,
  embeds with Voyage, and upserts into `document_chunks.embedding`.
- **Phase 4** — `/chat` runs hybrid retrieval (SQL + pgvector), enforces
  citations, and calls Claude Sonnet with strict grounding rules.
