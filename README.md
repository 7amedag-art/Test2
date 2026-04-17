# Energy Localization Platform (ELP)

منصة ذكاء توطين المحتوى المحلي في قطاع الطاقة السعودي.
Saudi energy-sector local-content intelligence platform.

Monorepo with:

- **`apps/web`** — Next.js 14 (App Router) + TypeScript + Tailwind (RTL, Arabic-first)
- **`apps/ai`** — FastAPI service for embeddings + RAG chat (Phase 3/4)
- **`packages/db`** — shared Prisma schema + seed + migrations
- **`scripts/`** — CSV import + template generation
- **`data/templates/`** — CSV column contracts for analysts
- **`docs/`** — architecture, migration plan, implementation notes

---

## Quick start

```bash
# 1. Boot Postgres + pgvector + MinIO
docker compose up -d

# 2. Install deps (pnpm required)
pnpm install

# 3. Create env
cp .env.example .env

# 4. Generate Prisma client + run migrations
pnpm db:generate
pnpm db:migrate          # creates initial tables + runs 0001_add_vector_column

# 5. Seed baseline users + sample rows
pnpm db:seed

# 6. Start the web app
pnpm dev                 # http://localhost:3000

# 7. Start the AI service (optional in Phase 1)
cd apps/ai
python -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Dev sign-in (after seeding):

- `admin@elp.local` / `admin123`
- `analyst@elp.local` / `analyst123`
- `viewer@elp.local` / `viewer123`

---

## Loading the 105 products

The analyst fills the CSV template and re-runs the import — no code change needed.

```bash
# 1. Regenerate the latest template (reads schema)
pnpm template:generate

# 2. Copy template to data/seed/ and edit
cp data/templates/products_template.csv      data/seed/products.csv
cp data/templates/manufacturers_template.csv data/seed/manufacturers.csv
cp data/templates/product_manufacturer_links_template.csv data/seed/links.csv

# 3. Import (idempotent — safe to re-run)
pnpm import:products
# or preview:
pnpm import:products --dry-run
```

---

## Phase roadmap

| Phase | Focus | Status |
|---|---|---|
| 1 | Foundations: schema, auth, CRUD, CSV import, admin shell | **This PR** |
| 2 | Localization workflow, gap engine, dashboard KPIs, filters, audit | scaffolded; rules need data |
| 3 | Document model, product-card synthesizer, embeddings, semantic search | stubs in `apps/ai` |
| 4 | RAG chat: retrieval, citations, anti-hallucination, bilingual | stubs in `apps/ai` |

Full design document: [`docs/DESIGN.md`](./docs/DESIGN.md).
Migration plan: [`docs/MIGRATION.md`](./docs/MIGRATION.md).
