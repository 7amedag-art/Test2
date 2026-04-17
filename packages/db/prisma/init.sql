-- Runs automatically on first container startup (via docker-compose).
-- Enables pgvector and prepares the embedding column for DocumentChunk.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- for fuzzy text search

-- Note: the `embedding` column on document_chunks is added via a migration
-- after Prisma creates the base table. See:
--   packages/db/prisma/migrations/0001_add_vector_column/migration.sql
