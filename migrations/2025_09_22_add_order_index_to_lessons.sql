-- 0) Añadir la columna order_index si no existe
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- 1) Backfill order_index por curso usando el primer número en el título como referencia
WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY course_id
      ORDER BY
        -- Extrae el primer número del título, si no hay, pone 100000
        COALESCE(
          (
            SELECT MIN((match[1])::int)
            FROM regexp_matches(lower(title), '(\d+)', 'g') AS match
          ),
          100000
        ),
        id
    ) AS rn
  FROM lessons
)
UPDATE lessons l
SET order_index = o.rn
FROM ordered o
WHERE o.id = l.id;

-- 2) Resequence: asegura order_index = 1..N por curso (estable)
WITH resequenced AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY course_id
      ORDER BY order_index NULLS LAST, id
    ) AS rn
  FROM lessons
)
UPDATE lessons l
SET order_index = r.rn
FROM resequenced r
WHERE r.id = l.id;

-- 3) Enforce NOT NULL
ALTER TABLE lessons
  ALTER COLUMN order_index SET NOT NULL;

-- 4) Índice único por curso + orden (evita colisiones)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_lessons_course_order
  ON lessons (course_id, order_index);

-- 5) Índice para ordenar por curso + orden (redundante pero útil si quitas el único)
CREATE INDEX IF NOT EXISTS idx_lessons_course_order
  ON lessons (course_id, order_index);
-- 3) Índice único por curso + orden (evita colisiones)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_lessons_course_order
  ON lessons (course_id, order_index);

-- 4) Índice para ordenar por curso + orden (redundante pero útil si quitas el único)
CREATE INDEX IF NOT EXISTS idx_lessons_course_order
  ON lessons (course_id, order_index);

COMMIT;
