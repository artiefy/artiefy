-- ============================================================================
-- Matrículas de programa sincronizadas con hojas (grupos)
-- Ejecutar en orden: 1) diagnóstico, 2) dedupe (solo si el 1 devolvió filas),
-- 3) migración final.
-- ============================================================================

-- 1) DIAGNÓSTICO de duplicados (solo lectura). Debe devolver 0 filas.
SELECT user_id, programa_id, COUNT(*) AS n, ARRAY_AGG(id ORDER BY id) AS ids
FROM enrollment_programs
GROUP BY user_id, programa_id
HAVING COUNT(*) > 1;

-- 2) DEDUPLICAR (solo si el paso 1 devolvió filas).
-- Conserva la fila más antigua por (user_id, programa_id), con
-- completed = true si alguna lo estaba y la fecha de inscripción más antigua.
BEGIN;

UPDATE enrollment_programs k
SET completed = d.any_completed,
    enrolled_at = d.first_enrolled
FROM (
  SELECT MIN(id) AS keep_id,
         BOOL_OR(COALESCE(completed, false)) AS any_completed,
         MIN(enrolled_at) AS first_enrolled
  FROM enrollment_programs
  GROUP BY user_id, programa_id
  HAVING COUNT(*) > 1
) d
WHERE k.id = d.keep_id;

DELETE FROM enrollment_programs e
USING enrollment_programs k
WHERE e.user_id = k.user_id
  AND e.programa_id = k.programa_id
  AND e.id > k.id;

COMMIT;

-- 3) MIGRACIÓN FINAL (idempotente).
BEGIN;

-- Una matrícula por usuario + programa.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_enrollment_programs_user_programa
  ON enrollment_programs (user_id, programa_id);

-- true = creada exclusivamente por la sincronización de hojas.
-- false (todas las existentes) = manual/legada: nunca se borra automáticamente.
ALTER TABLE enrollment_programs
  ADD COLUMN IF NOT EXISTS creada_por_grupo boolean NOT NULL DEFAULT false;

-- Qué hojas justifican cada matrícula.
CREATE TABLE IF NOT EXISTS enrollment_program_sources (
  id serial PRIMARY KEY,
  enrollment_program_id integer NOT NULL
    REFERENCES enrollment_programs(id) ON DELETE CASCADE,
  grupo_id integer NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uniq_enrollment_program_source
    UNIQUE (enrollment_program_id, grupo_id)
);
CREATE INDEX IF NOT EXISTS enrollment_program_sources_grupo_idx
  ON enrollment_program_sources (grupo_id);

COMMIT;

-- (Además, si no lo ejecutaste antes: scripts/grupo_programas.sql crea
-- grupo_programas, la relación hoja ↔ programa.)
