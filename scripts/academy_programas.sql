-- Academias: programas (agrupan cursos de la academia).
--
-- Reversible con:
--   DROP TABLE academy_programa_cursos;
--   DROP TABLE academy_programas;

CREATE TABLE IF NOT EXISTS academy_programas (
  id           serial PRIMARY KEY,
  academy_id   integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  description  text,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_programas_academy_idx
  ON academy_programas (academy_id);

CREATE TABLE IF NOT EXISTS academy_programa_cursos (
  id           serial PRIMARY KEY,
  programa_id  integer NOT NULL REFERENCES academy_programas(id) ON DELETE CASCADE,
  course_id    integer NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  CONSTRAINT academy_programa_cursos_unico UNIQUE (programa_id, course_id)
);
