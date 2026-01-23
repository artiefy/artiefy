-- Crear tabla de relación muchos-a-muchos entre cursos e instructores
CREATE TABLE IF NOT EXISTS "course_instructors" (
  "id" SERIAL PRIMARY KEY,
  "course_id" INTEGER NOT NULL,
  "instructor_id" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "course_instructors_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE,
  CONSTRAINT "course_instructors_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "course_instructor_unique" UNIQUE ("course_id", "instructor_id")
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS "course_instructors_course_id_idx" ON "course_instructors"("course_id");
CREATE INDEX IF NOT EXISTS "course_instructors_instructor_id_idx" ON "course_instructors"("instructor_id");

-- Migrar datos existentes del campo instructor a la nueva tabla
-- Solo migra si el instructor existe y no está vacío
INSERT INTO "course_instructors" ("course_id", "instructor_id", "created_at")
SELECT 
  c."id" AS "course_id",
  c."instructor" AS "instructor_id",
  COALESCE(c."created_at", NOW()) AS "created_at"
FROM "courses" c
WHERE 
  c."instructor" IS NOT NULL 
  AND c."instructor" != ''
  AND EXISTS (SELECT 1 FROM "users" u WHERE u."id" = c."instructor")
ON CONFLICT ("course_id", "instructor_id") DO NOTHING;

-- NOTA: No eliminamos el campo instructor aún para mantener compatibilidad retroactiva
-- Puedes eliminarlo más adelante con: ALTER TABLE "courses" DROP COLUMN "instructor";
