-- Academias: grupos de estudiantes (opcionalmente ligados a un curso).
--
-- Reversible con:
--   DROP TABLE academy_grupo_estudiantes;
--   DROP TABLE academy_grupos;

CREATE TABLE IF NOT EXISTS academy_grupos (
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  nombre      text        NOT NULL,
  course_id   integer     REFERENCES academy_courses(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_grupos_academy_idx
  ON academy_grupos (academy_id);

CREATE TABLE IF NOT EXISTS academy_grupo_estudiantes (
  id        serial PRIMARY KEY,
  grupo_id  integer NOT NULL REFERENCES academy_grupos(id) ON DELETE CASCADE,
  -- Cuenta de Clerk del estudiante (fila de academy_users de esa academia).
  user_id   text    NOT NULL,
  CONSTRAINT academy_grupo_estudiantes_unico UNIQUE (grupo_id, user_id)
);
