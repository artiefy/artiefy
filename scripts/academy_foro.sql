-- Foro de cada curso del aula del estudiante en las academias. Tabla nueva.
CREATE TABLE IF NOT EXISTS academy_course_forum (
  id serial PRIMARY KEY,
  academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  course_id integer NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  parent_id integer,
  titulo text,
  contenido text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academy_course_forum_course_idx ON academy_course_forum (course_id);
