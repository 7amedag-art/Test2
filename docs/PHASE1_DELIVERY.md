# Phase 1 — delivery summary

## What ships in this PR

### Foundation
- pnpm monorepo: `apps/web`, `apps/ai`, `packages/db`, `scripts/`.
- `docker-compose.yml` spins up Postgres 16 + pgvector + MinIO.
- `.env.example` documents every knob.

### Database
- Full Prisma schema covering products, manufacturers, product-manufacturer
  links, localization status, gap analysis, evidence, approval requests,
  audit log, documents + chunks (RAG scaffolded), chat sessions/messages,
  NextAuth tables.
- Hand-written migration `0001_add_vector_column` adds `vector(1024)` +
  HNSW + GIN + trigram indexes (Prisma can't model pgvector natively).
- Seed script creates 3 baseline users (admin/analyst/viewer), 3 sample
  products with shell localization + gap rows, 3 sample manufacturers.

### CSV pipeline
- `data/templates/*.csv` + auto-generated `.md` column references.
- `scripts/generate-template.ts` regenerates templates from code (run when
  the schema evolves).
- `scripts/import-products.ts` idempotent importer for products,
  manufacturers, and M:N links; supports `--dry-run`.

### Web app (Next.js 14)
- Arabic-first UI with RTL, locale toggle persisted in a cookie, inline
  i18n dictionary for both languages.
- NextAuth (credentials provider) with JWT sessions.
- Role-based access control: `viewer < analyst < admin`.
- Middleware protects everything except `/sign-in` and `/api/auth/*`.
- Pages: Dashboard, Products (list + detail), Manufacturers (local/global
  tabs), Evidence, Gaps, Chat (Phase-4 placeholder), Admin (new product,
  new manufacturer, CSV import info, recompute), Audit log.
- Forms: create product, create manufacturer, sign-in.
- Shared primitives (`card`, `btn`, `badge`) in `globals.css`.

### API (Next.js Route Handlers)
- `GET /api/v1/health` — DB liveness.
- `GET|POST /api/v1/products`
- `GET|PATCH|DELETE /api/v1/products/[id]`
- `POST /api/v1/products/[id]/manufacturers` — link.
- `GET|POST /api/v1/manufacturers`
- `GET|PATCH|DELETE /api/v1/manufacturers/[id]` (verification changes open
  an ApprovalRequest automatically).
- `GET|POST /api/v1/evidence`
- `PATCH|DELETE /api/v1/evidence/[id]`
- `PATCH /api/v1/localization/[productId]` (auto ApprovalRequest).
- `POST /api/v1/gap-analysis/recompute` (single or bulk).
- `GET /api/v1/templates/[kind]` — download CSV templates.
- `POST /api/locale` — locale cookie.

### Gap engine
- `apps/web/lib/gap.ts` — five-component scoring with tunable weights,
  derives `localizationGap` + `recommendation` + rationale.

### Audit + approvals
- Every mutation in the CRUD routes writes to `audit_log` via
  `writeAudit()`.
- Localization and verification changes also open `approval_requests`.

### AI service (Phase-1 placeholder)
- FastAPI app with `/health`, token-gated `/embed/product/{id}` and
  `/chat` endpoints that currently return placeholders. The contracts
  are locked so the web app can be wired against them in Phase 4 without
  further design churn.

### Docs
- `README.md` — quick start + 105-product CSV loading workflow.
- `docs/DESIGN.md` — architecture, RBAC, approval workflow, gap engine,
  RAG contract, deployment paths.
- `docs/MIGRATION.md` — dev→prod migration plan, schema-change policy,
  indexes, backup.

## What explicitly does NOT ship yet (by plan)

- **RAG chat**: service stubs only — Phase 4.
- **Embeddings pipeline**: schema is ready; ingestion worker in Phase 3.
- **UI CSV upload**: CLI importer only in Phase 1; UI upload is Phase 2.
- **Map view on Manufacturers**: Phase 2.
- **Dashboard charts**: KPI cards + top-opportunities table ship now; full
  charts (donut/bar/heatmap) move to Phase 2 once data is richer.

## Assumptions made

1. Password hashing uses SHA-256 in the dev seed and credentials provider.
   Switch to bcrypt/argon2 (already in `package.json`) at real-user
   onboarding — identical API surface.
2. Approval workflow is "lightweight" — requests are logged and admins can
   self-approve; an actual review-and-decide UI is Phase 2.
3. `manufacturing_complexity_score` is currently derived from criticality.
   Adding it as a first-class CSV field is a 2-line change.
4. Embedding dimension fixed at 1024 (Voyage `voyage-3-large`). Switching
   to OpenAI `text-embedding-3-large` (3072) only requires editing the
   `ALTER TABLE` in `0001_add_vector_column`.

## Next up (Phase 2 teaser)

- Wire localization-status edit forms + approval decision UI.
- Ship full dashboard charts.
- Add manufacturer detail page with product list.
- Add product-manufacturer link UI from the product detail page.
- Add CSV upload from browser → same pipeline.
