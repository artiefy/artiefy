-- ============================================================
-- Hojas por curso dentro de un grupo (varias por grupo)
-- Ejecutar en Neon. Corre CADA sentencia (seguro re-ejecutar).
-- ============================================================

-- 1) Tabla de hojas (curso asignado al grupo + su enlace de Teams)
CREATE TABLE IF NOT EXISTS "grupo_cursos" (
  "id" serial PRIMARY KEY NOT NULL,
  "grupo_id" integer NOT NULL,
  "course_id" integer NOT NULL,
  "teams_join_url" text,
  "teams_meeting_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "uniq_grupo_curso" UNIQUE("grupo_id","course_id")
);

-- 2) Las sesiones de asistencia ahora pertenecen a una hoja (curso)
ALTER TABLE "grupo_sesiones" ADD COLUMN IF NOT EXISTS "course_id" integer;
