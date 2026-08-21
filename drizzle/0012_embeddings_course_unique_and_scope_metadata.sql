-- Completa la migración 0011 sobre document_embeddings.
--
-- Estado verificado en Neon antes de escribir esto:
--   - project_id, el CHECK de dueño único y document_embeddings_project_unique
--     ya están aplicados.
--   - metadata ya es jsonb.
--   - FALTA document_embeddings_course_unique: el paso 4 de la 0011 borró
--     document_embeddings_unique pero no llegó a crear su reemplazo de curso.
--   - 1426 filas (1425 de curso, 1 de proyecto), 0 grupos duplicados.

BEGIN;

-- 1) El índice único que quedó faltando.
--    Sin él, el `ON CONFLICT (course_id, content, chunk_index)
--    WHERE course_id IS NOT NULL` de src/lib/embeddings/search.ts no encuentra
--    ningún índice que corresponda y Postgres aborta el INSERT. Verificado:
--    0 duplicados, así que la creación no puede fallar por datos existentes.
CREATE UNIQUE INDEX IF NOT EXISTS document_embeddings_course_unique
  ON document_embeddings (course_id, content, chunk_index)
  WHERE course_id IS NOT NULL;

-- 2) El dueño, también dentro de metadata.
--    El nodo PGVector de n8n solo sabe filtrar por claves del JSON de
--    metadata, no por columnas sueltas. Hoy metadata solo trae
--    {source, totalChunks, chunkSize, overlap}, así que el RAG no puede
--    acotarse a un curso. Se agregan como texto porque ese filtro compara
--    strings. Con esto NO hace falta reindexar los 154 cursos.
UPDATE document_embeddings
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'scope', 'course',
      'courseId', course_id::text
    )
WHERE course_id IS NOT NULL;

UPDATE document_embeddings
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'scope', 'project',
      'projectId', project_id::text
    )
WHERE project_id IS NOT NULL;

COMMIT;
