-- ============================================================
-- Grupos de estudiantes (control de coordinación tipo Excel)
-- Ejecutar en Neon. Seguro de re-ejecutar (IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS "grupos" (
  "id" serial PRIMARY KEY NOT NULL,
  "nombre" text NOT NULL,
  "programa" text,
  "filtro_columna" text,
  "filtro_valor" text,
  "course_id" integer,
  "teams_join_url" text,
  "teams_meeting_id" text,
  "created_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "grupo_estudiantes" (
  "id" serial PRIMARY KEY NOT NULL,
  "grupo_id" integer NOT NULL,
  "user_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "uniq_grupo_estudiante" UNIQUE("grupo_id","user_id")
);

CREATE TABLE IF NOT EXISTS "grupo_sesiones" (
  "id" serial PRIMARY KEY NOT NULL,
  "grupo_id" integer NOT NULL,
  "fecha" date NOT NULL,
  "titulo" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "grupo_asistencia" (
  "id" serial PRIMARY KEY NOT NULL,
  "sesion_id" integer NOT NULL,
  "user_id" text NOT NULL,
  "estado" text DEFAULT 'presente' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "uniq_sesion_asistencia" UNIQUE("sesion_id","user_id")
);

-- Llaves foráneas (ignoran error si ya existen)
DO $$ BEGIN
  ALTER TABLE "grupos" ADD CONSTRAINT "grupos_course_id_courses_id_fk"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "grupos" ADD CONSTRAINT "grupos_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "users"("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "grupo_estudiantes" ADD CONSTRAINT "grupo_estudiantes_grupo_id_grupos_id_fk"
    FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "grupo_estudiantes" ADD CONSTRAINT "grupo_estudiantes_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "grupo_sesiones" ADD CONSTRAINT "grupo_sesiones_grupo_id_grupos_id_fk"
    FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "grupo_asistencia" ADD CONSTRAINT "grupo_asistencia_sesion_id_grupo_sesiones_id_fk"
    FOREIGN KEY ("sesion_id") REFERENCES "grupo_sesiones"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "grupo_asistencia" ADD CONSTRAINT "grupo_asistencia_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "grupo_estudiantes_grupo_idx" ON "grupo_estudiantes" ("grupo_id");
CREATE INDEX IF NOT EXISTS "grupo_sesiones_grupo_idx" ON "grupo_sesiones" ("grupo_id");
CREATE INDEX IF NOT EXISTS "grupo_asistencia_sesion_idx" ON "grupo_asistencia" ("sesion_id");
