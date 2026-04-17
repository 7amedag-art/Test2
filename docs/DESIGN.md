# ELP — full design (approved 2026-04-17)

## Stack (locked)

| Layer | Tech |
|---|---|
| Web | Next.js 14 (App Router) + TypeScript + Tailwind + NextAuth |
| AI  | FastAPI (Python 3.11) |
| DB  | PostgreSQL 16 + pgvector |
| ORM | Prisma (web) + SQLAlchemy (ai) |
| LLM | Claude Sonnet 4.6 (`claude-sonnet-4-6`) |
| Embeddings | Voyage `voyage-3-large` (multilingual, 1024 dim) |
| Storage | S3-compatible (MinIO in dev) |

## Module map

```
apps/
  web/            ← Next.js user app (CRUD, dashboard, admin, future chat UI)
    app/
      (app)/      ← authenticated routes (dashboard, products, manufacturers, …)
      sign-in/
      api/
        auth/     ← NextAuth
        v1/       ← internal REST API (products, manufacturers, evidence, …)
    lib/          ← db client, auth, rbac, api helpers, i18n, gap engine
    components/   ← Sidebar, Topbar, LocaleToggle
  ai/             ← FastAPI service (Phase 3/4)
packages/
  db/             ← Prisma schema + seed + migrations + client export
scripts/          ← CLI: CSV import + template regen
data/
  templates/      ← canonical CSV schemas
  seed/           ← analyst drop-in folder
docs/             ← design & migration docs
```

## Domain model (summary)

- **Product** (105 target) — trilingual names, specs (JSONB), HS code,
  price band, criticality, strategic importance, approval status.
- **Manufacturer** — global or local, typed (OEM / assembler / distributor /
  service / local), with capability level, verification status, certifications.
- **ProductManufacturer** — M:N with relationship type and `verified` flag.
- **LocalizationStatus** (1:1) — `is_localized`, count, percentage, risk,
  notes, + `approvalStatus` + `reviewedBy`/`reviewedAt`.
- **GapAnalysis** (1:1) — five component scores + `finalOpportunityScore`
  + `localizationGap` + `recommendation` + `rationale`.
- **Evidence** — polymorphic (entity_type/entity_id) with `claim_type`,
  source, excerpt, `confidence_score`, `verification_status`.
- **ApprovalRequest** — lightweight workflow: any change to localization,
  verification, or gap recommendation creates a row.
- **AuditLog** — tamper-evident record of every mutation.
- **Document / DocumentChunk** — RAG store (vector column added via hand
  migration); populated in Phase 3.
- **ChatSession / ChatMessage** — conversation history with retrieved IDs +
  citations; used in Phase 4.

## RBAC

| Role | Can |
|---|---|
| viewer | Read everything |
| analyst | Create/update products, manufacturers, evidence; trigger recompute; propose localization/verification changes (opens ApprovalRequest as `pending_review`) |
| admin | Everything above + delete + self-approve localization/verification changes |

Route protection lives in `apps/web/middleware.ts`; API-level enforcement
lives in `apps/web/lib/rbac.ts::requireRole`.

## Approval workflow

Any change to:
- `LocalizationStatus` (any field)
- `Manufacturer.verificationStatus`
- `GapAnalysis.recommendation`

…creates an `ApprovalRequest` row with `payloadDiff`, status `pending_review`
(or `approved` when an admin makes the change directly). The audit log records
the mutation independently.

## Gap-analysis engine

Implemented in `apps/web/lib/gap.ts`. Five component scores (0-100):

| Score | Source |
|---|---|
| demandScore | criticality × segment-demand map |
| strategicScore | presence of strategic-importance note |
| localizationScore | current `localization_percentage` |
| manufacturingComplexityScore | criticality proxy (can become a CSV field later) |
| supplyRiskScore | `supply_risk_level` map |

Weighted blend (tunable in one place):

```
opportunity =
  0.25·demand + 0.25·strategic +
  0.20·(100-localization) + 0.15·(100-complexity) + 0.15·risk
```

`localizationGap`: high ≥ 70, medium ≥ 45, else low.
`recommendation`: `sufficient` if local ≥ 70, `expand` if ≥ 30, else
`need_local_manufacturing`.

## RAG chat (Phase 4 contract — fixed now)

- `/ai/v1/chat` accepts `{ session_id?, message, lang? }` and returns
  `{ session_id, answer, citations[] }`.
- Retrieval is **hybrid**: SQL on products/manufacturers/localization filtered
  by detected entities + pgvector similarity on `document_chunks.embedding`.
- **Anti-hallucination**:
  1. Refuse to answer outside the returned context (explicit system rule).
  2. Answer includes required citations; any claim without a citation is
     stripped in post-processing.
  3. Tool-use option: Claude can call `get_product`, `get_localization`,
     `search_manufacturers` to read structured rows directly, which we
     prefer for factual fields (prevents paraphrase errors).
- Bilingual: `lang` is auto-detected and the reply matches.

## Deployment paths

- **Dev**: all local via `docker compose up` + `pnpm dev`.
- **Managed staging**: Neon/Supabase Postgres + Vercel for `apps/web` +
  Fly.io/Railway for `apps/ai` + any S3-compatible bucket.
- **KSA data-residency**: drop-in swap of DB host and S3 bucket to a Saudi
  region provider. All provider-specific logic sits behind environment
  variables — no code changes required.
