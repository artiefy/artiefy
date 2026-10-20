-- Comentarios por estudiante (no ligados a grupos). Cada comentario puede tener
-- respuestas anidadas vía parent_id (self-reference).
-- Ejecutar una vez contra la base de datos.

CREATE TABLE IF NOT EXISTS "student_comments" (
  "id" serial PRIMARY KEY NOT NULL,
  "student_id" text NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "author_id" text REFERENCES "users" ("id") ON DELETE SET NULL,
  "parent_id" integer REFERENCES "student_comments" ("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "student_comments_student_idx"
  ON "student_comments" ("student_id");

CREATE INDEX IF NOT EXISTS "student_comments_parent_idx"
  ON "student_comments" ("parent_id");
