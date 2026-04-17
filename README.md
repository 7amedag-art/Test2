# Energy Localization Platform (ELP)

منصة ذكاء توطين المحتوى المحلي في قطاع الطاقة السعودي.
Saudi energy-sector local-content intelligence platform.

Monorepo layout:

- **`apps/web`** — Next.js 14 (App Router) + TypeScript + Tailwind (RTL, Arabic-first)
- **`apps/ai`** — FastAPI stub for embeddings + RAG chat (reserved for Phase 3/4; not required in Phase 1)
- **`packages/db`** — shared Prisma schema + seed + migrations
- **`scripts/`** — CSV import + template generation (kept for Phase 2; no data loaded yet)
- **`data/templates/`** — CSV column contracts for analysts
- **`docs/`** — design, migration plan, Phase 1 delivery notes

---

## Prerequisites

- Node.js ≥ 20
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.12.3 --activate`)
- PostgreSQL 15+ (local or via `docker compose up -d db`). pgvector is only required for Phase 3; Phase 1 works on stock Postgres.

---

## Run locally (Phase 1)

```bash
# 1. Install
pnpm install

# 2. Bring up Postgres (docker compose) or point DATABASE_URL at your own
docker compose up -d db

# 3. Environment
cp .env.example .env
# edit DATABASE_URL / NEXTAUTH_SECRET if needed
# for the web app, mirror the same vars:
cp .env apps/web/.env.local

# 4. Prisma client + schema push
pnpm db:generate
pnpm db:push           # creates all Phase 1 tables

# 5. Seed baseline users + 3 sample products + 3 sample manufacturers
pnpm db:seed

# 6. Start the web app
pnpm dev               # http://localhost:3000
```

Default sign-in accounts (dev only — change for any shared deploy):

| Role     | Email                 | Password     |
|----------|-----------------------|--------------|
| admin    | `admin@elp.local`     | `admin123`   |
| analyst  | `analyst@elp.local`   | `analyst123` |
| viewer   | `viewer@elp.local`    | `viewer123`  |

---

## Sample API usage

All write endpoints require an authenticated session cookie. Sign in via the UI at `/sign-in`, or with curl:

```bash
# capture CSRF + session cookie into ./cookies.txt
CSRF=$(curl -sS -c cookies.txt http://localhost:3000/api/auth/csrf \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])")

curl -sS -b cookies.txt -c cookies.txt \
  -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "email=admin@elp.local" \
  --data-urlencode "password=admin123" \
  --data-urlencode "csrfToken=$CSRF" \
  --data-urlencode "json=true"

# Health (public)
curl -sS http://localhost:3000/api/v1/health

# List products
curl -sS -b cookies.txt "http://localhost:3000/api/v1/products?limit=10"

# Create a product (analyst or admin)
curl -sS -b cookies.txt -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "productCode": "ELP-OG-042",
    "productNameEn": "Subsea Wellhead System",
    "productNameAr": "نظام رأس البئر تحت البحر",
    "category": "Wellhead Equipment",
    "industrySegment": "oil_gas",
    "criticalityLevel": "high",
    "hsCode": "8481.10"
  }'

# Create a manufacturer
curl -sS -b cookies.txt -X POST http://localhost:3000/api/v1/manufacturers \
  -H "Content-Type: application/json" \
  -d '{
    "manufacturerName": "Example Saudi Mfr",
    "isLocal": true,
    "manufacturerType": "local_manufacturer",
    "localCapabilityLevel": "partial_manufacturing",
    "country": "Saudi Arabia"
  }'

# Link manufacturer -> product (relationshipType is required)
curl -sS -b cookies.txt \
  -X POST http://localhost:3000/api/v1/products/<PRODUCT_ID>/manufacturers \
  -H "Content-Type: application/json" \
  -d '{
    "manufacturerId": "<MANUFACTURER_ID>",
    "relationshipType": "primary_oem",
    "verified": true
  }'
```

RBAC summary:

- `viewer` — can GET any resource
- `analyst` — can create/update products, manufacturers, evidence, links; cannot delete
- `admin` — full access including DELETE

---

## CSV import (deferred to the next step)

The dataset of ~150 strategic energy products will be loaded later. The tooling is in place but **no CSVs are present in `data/seed/` yet** — that is intentional.

When ready:

```bash
pnpm template:generate      # regenerate empty CSV templates from the schema
# place filled CSVs at data/seed/{products,manufacturers,links}.csv
pnpm import:products --dry-run
pnpm import:products
```

---

## Useful scripts

| Command              | What it does                                          |
|----------------------|-------------------------------------------------------|
| `pnpm dev`           | Start Next.js in dev mode                             |
| `pnpm build`         | Production build of the web app                       |
| `pnpm typecheck`     | TypeScript across every workspace                     |
| `pnpm lint`          | ESLint across every workspace                         |
| `pnpm db:generate`   | Regenerate Prisma client                              |
| `pnpm db:push`       | Push schema to the database (no migration history)    |
| `pnpm db:migrate`    | Create/apply a migration                              |
| `pnpm db:seed`       | Seed users + 3 sample products + 3 sample mfrs        |
| `pnpm db:reset`      | Drop + recreate + re-seed (destructive)               |

---

## Phase roadmap

| Phase | Focus                                                                   | Status         |
|-------|-------------------------------------------------------------------------|----------------|
| 1     | Foundations: schema, auth, CRUD, CSV tooling, admin shell               | **stable**     |
| 2     | 150-product dataset, gap-engine rules, dashboard KPIs, approval flow    | next           |
| 3     | Document model, product-card synthesizer, embeddings, semantic search   | stubbed        |
| 4     | RAG chat: retrieval, citations, anti-hallucination, bilingual           | stubbed        |

See [`docs/DESIGN.md`](./docs/DESIGN.md), [`docs/MIGRATION.md`](./docs/MIGRATION.md), and [`docs/PHASE1_DELIVERY.md`](./docs/PHASE1_DELIVERY.md).
