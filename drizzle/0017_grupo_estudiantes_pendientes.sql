CREATE TABLE IF NOT EXISTS "grupo_estudiantes_pendientes" (
  "id" serial PRIMARY KEY,
  "grupo_id" integer NOT NULL REFERENCES "grupos"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "identificacion_numero" text,
  "phone" text,
  "modalidad" text,
  "observaciones" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "grupo_estudiantes_pendientes_grupo_idx"
  ON "grupo_estudiantes_pendientes" ("grupo_id");