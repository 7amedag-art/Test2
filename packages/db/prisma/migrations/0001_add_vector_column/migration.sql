-- Applied AFTER the base Prisma migration to add the pgvector column
-- that Prisma cannot model natively. Run via `prisma migrate dev` after
-- the initial schema migration is generated.

-- Add the embedding column (1024 dims = voyage-3-large; change if you swap providers).
ALTER TABLE "document_chunks"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1024);

-- HNSW index for cosine similarity (fast ANN).
CREATE INDEX IF NOT EXISTS "idx_document_chunks_embedding"
  ON "document_chunks"
  USING hnsw ("embedding" vector_cosine_ops);

-- GIN index on chunk metadata for hybrid filter+semantic retrieval.
CREATE INDEX IF NOT EXISTS "idx_document_chunks_metadata"
  ON "document_chunks"
  USING GIN ("metadata");

-- Trigram indexes for fast bilingual text search on products & manufacturers.
CREATE INDEX IF NOT EXISTS "idx_products_name_en_trgm"
  ON "products" USING GIN ("product_name_en" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_products_name_ar_trgm"
  ON "products" USING GIN ("product_name_ar" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_manufacturers_name_trgm"
  ON "manufacturers" USING GIN ("manufacturer_name" gin_trgm_ops);
