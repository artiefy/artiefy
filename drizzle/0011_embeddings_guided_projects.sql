-- Permite que document_embeddings pertenezca a un curso O a un proyecto guiado.
--
-- Contexto: hoy course_id es NOT NULL con FK a courses, asi que no hay forma de
-- guardar embeddings de guided_projects (que es otra tabla, no un curso).
--
-- Estado al momento de escribir esto: 1425 filas, todas con course_id.
-- Ninguna se modifica ni se borra.

BEGIN;

-- 1) course_id pasa a opcional (las filas existentes lo conservan)
ALTER TABLE document_embeddings
  ALTER COLUMN course_id DROP NOT NULL;

-- 2) Nueva columna para proyectos guiados
ALTER TABLE document_embeddings
  ADD COLUMN IF NOT EXISTS project_id integer;

ALTER TABLE document_embeddings
  ADD CONSTRAINT document_embeddings_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES guided_projects(id) ON DELETE CASCADE;

-- 3) Exactamente uno de los dos dueños debe estar presente.
--    Sin esto se podrian crear filas huerfanas (ambos NULL) o ambiguas (ambos).
ALTER TABLE document_embeddings
  ADD CONSTRAINT document_embeddings_owner_check
  CHECK (
    (course_id IS NOT NULL AND project_id IS NULL)
    OR
    (course_id IS NULL AND project_id IS NOT NULL)
  );

-- 4) IMPORTANTE: reemplazar el indice unico.
--    El actual es UNIQUE (course_id, content, chunk_index). Al volverse
--    course_id nullable deja de servir para los proyectos, porque en Postgres
--    NULL nunca es igual a NULL en un indice unico: se podrian insertar filas
--    duplicadas de proyecto sin que nada lo impida.
--    Se parte en dos indices parciales, uno por cada dueño.
DROP INDEX IF EXISTS document_embeddings_unique;

CREATE UNIQUE INDEX document_embeddings_course_unique
  ON document_embeddings (course_id, content, chunk_index)
  WHERE course_id IS NOT NULL;

CREATE UNIQUE INDEX document_embeddings_project_unique
  ON document_embeddings (project_id, content, chunk_index)
  WHERE project_id IS NOT NULL;

-- 5) Indice de busqueda por proyecto, equivalente al que ya existe por curso
CREATE INDEX IF NOT EXISTS document_embeddings_project_id_idx
  ON document_embeddings (project_id);

COMMIT;
