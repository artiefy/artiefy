-- 1) Resequence: asegura order_index = 1..N por curso (estable)
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

-- 2) Enforce NOT NULL
ALTER TABLE lessons
  ALTER COLUMN order_index SET NOT NULL;

-- 3) Índice único por curso + orden (evita colisiones)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_lessons_course_order
  ON lessons (course_id, order_index);

-- 4) Índice para ordenar por curso + orden (redundante pero útil si quitas el único)
CREATE INDEX IF NOT EXISTS idx_lessons_course_order
  ON lessons (course_id, order_index);
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uniq_lessons_course_order'
  ) THEN
    CREATE UNIQUE INDEX uniq_lessons_course_order
      ON lessons (course_id, order_index);
  END IF;
END$$;

-- 4) Índice para ordenar por curso + orden
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_lessons_course_order'
  ) THEN
    CREATE INDEX idx_lessons_course_order
      ON lessons (course_id, order_index);
  END IF;
END$$;

COMMIT;
