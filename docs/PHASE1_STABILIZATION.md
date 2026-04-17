# Phase 1 — stabilization pass

This pass did **not** introduce new features. It validated the Phase 1
foundation end-to-end against a real Postgres instance, fixed the bugs that
surfaced, and polished the setup story. The 150-product dataset is **not**
loaded here — that is the next step.

## Fixes applied

1. **Evidence polymorphic relation was broken.**
   `packages/db/prisma/schema.prisma` declared `Evidence.product` and
   `Evidence.manufacturer` as typed relations both pointing at the same
   `entityId` column. Prisma generated two conflicting foreign-key
   constraints (`evidence_entity_id_fkey` to `products` *and* to
   `manufacturers`) — every INSERT would have failed FK validation because
   a single UUID cannot exist in both tables.
   Removed the typed relations on `Evidence` and the reciprocal
   `Product.evidence` / `Manufacturer.evidence` arrays. Evidence stays
   polymorphic via `entityType` + `entityId` scalar columns with a
   composite index. Detail pages now fetch evidence with a parallel
   `prisma.evidence.findMany({ where: { entityType, entityId } })`.
   Files touched:
   - `packages/db/prisma/schema.prisma`
   - `apps/web/app/(app)/products/[id]/page.tsx`
   - `apps/web/app/api/v1/manufacturers/[id]/route.ts`

2. **TypeScript errors on nullable JSON columns.**
   `technicalSpecs` is `Json?` in the schema, but the product create/update
   handlers were spreading the parsed payload directly into
   `prisma.product.create` / `.update`, which does not accept a plain JS
   `null` — Prisma needs `Prisma.JsonNull`. Destructured the field out,
   converted `null → Prisma.JsonNull`, `undefined → undefined`, value →
   `Prisma.InputJsonValue`. Same pattern for `priceRangeMin/Max`.
   Files touched:
   - `apps/web/app/api/v1/products/route.ts`
   - `apps/web/app/api/v1/products/[id]/route.ts`

3. **Seed manufacturer upsert used the wrong key.**
   `prisma.manufacturer.upsert({ where: { id: m.manufacturerName } })` —
   `id` is a UUID, `manufacturerName` is an arbitrary string, so this would
   throw on every seed run. Replaced with a `findFirst` + `create` pattern
   keyed on `manufacturerName`.
   File touched: `packages/db/prisma/seed.ts`.

4. **Root-level scripts couldn't resolve their dependencies.**
   `tsx scripts/import-products.ts` imports `@prisma/client` and
   `csv-parse/sync`, but those were only listed as deps of sub-packages.
   Added `@elp/db: workspace:*`, `@prisma/client`, `csv-parse`, and `tsx`
   to root `devDependencies` so the scripts run from the repo root.
   File touched: `package.json`.

5. **`/api/v1/health` was not publicly reachable.**
   The NextAuth middleware matcher only excluded `/api/auth`, so the
   liveness probe was being redirected to `/sign-in`. Added `api/v1/health`
   to the negative lookahead. Verified with `curl` that it returns
   `HTTP 200 {"status":"ok","db":"up"}`.
   File touched: `apps/web/middleware.ts`.

## Validation run (proof of life)

Against Postgres 16 on `127.0.0.1:5433` with a fresh schema:

| Check                                                | Result |
|------------------------------------------------------|--------|
| `pnpm typecheck` across every workspace              | pass   |
| `pnpm build` (Next.js production build, 29 routes)   | pass   |
| `prisma db push` + custom `0001_add_vector_column`   | pass   |
| `pnpm db:seed`                                       | 3 users + 3 products + 3 manufacturers created |
| `GET /api/v1/health` (anonymous)                     | 200, `db:up` |
| Sign in as admin (NextAuth credentials)              | session cookie OK |
| `POST /api/v1/products`                              | 201, row returned |
| `GET /api/v1/products?limit=10`                      | 200, paginated |
| `POST /api/v1/manufacturers`                         | 201 |
| `POST /api/v1/products/:id/manufacturers` (link)     | 201, m2m row created |
| `GET /api/v1/products/:id` (with `manufacturers[]`)  | reflects the link |
| Sign in as viewer → `GET /api/v1/products`           | 200 |
| Viewer → `POST /api/v1/products`                     | 403 `{"error":"forbidden","required":"analyst"}` |
| Admin → `DELETE` the test product + manufacturer     | 200 |

## Known issues / limitations (still open by design)

1. **CSV dataset not loaded.** `data/seed/` is empty on purpose. The 150
   strategic energy products are loaded in the next step via
   `pnpm import:products`.
2. **Password hashing is SHA-256** for both the seed and the credentials
   provider. Fine for local dev; swap for bcrypt/argon2 before any shared
   deploy. `bcryptjs` is already in `apps/web/package.json`.
3. **Approval workflow is logging-only.** Localization-status and
   manufacturer-verification changes create `ApprovalRequest` rows, but the
   "review & decide" UI is a Phase 2 task.
4. **AI service is a stub.** `apps/ai` returns placeholder responses. The
   HTTP contract is locked; wiring it up is Phase 3/4.
5. **pgvector is not required for Phase 1.** The `0001_add_vector_column`
   migration is kept in the tree for Phase 3 and is safe to run against
   stock Postgres only if the `vector` extension is present.
6. **No production secrets.** `.env.example` uses placeholder values; a
   real `NEXTAUTH_SECRET` and DB credentials are required for any shared
   environment.

## How to run the exact validation locally

```bash
pnpm install
docker compose up -d db
cp .env.example .env && cp .env apps/web/.env.local
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm build
pnpm --filter @elp/web start   # or: pnpm dev
curl http://localhost:3000/api/v1/health
```

Sign in as `admin@elp.local` / `admin123` and exercise the API as shown in
the root `README.md`.
