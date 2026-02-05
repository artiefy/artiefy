-- Enable pgvector extension and create indexes for embeddings
-- Migration for vector similarity search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- The document_embeddings table will use pgvector type
-- Make sure to create the table with proper vector type
-- This is handled by Drizzle schema definition

-- Create HNSW index for faster similarity searches
-- Note: Run this after the table is created and has data
-- CREATE INDEX IF NOT EXISTS embedding_hnsw_idx 
--   ON document_embeddings USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);

-- Alternative: GiST index (works well for most cases)
-- CREATE INDEX IF NOT EXISTS embedding_gist_idx 
--   ON document_embeddings USING gist (embedding vector_cosine_ops);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS course_id_idx ON document_embeddings (course_id);
CREATE INDEX IF NOT EXISTS source_idx ON document_embeddings (source);

-- Optional: Create a composite index for course and source
CREATE INDEX IF NOT EXISTS course_source_idx ON document_embeddings (course_id, source);
