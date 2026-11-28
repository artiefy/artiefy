-- Comentarios por clase y opiniones del curso del aula del estudiante en las
-- academias. Tablas nuevas; no tocan datos existentes.
CREATE TABLE IF NOT EXISTS academy_lesson_comments (
  id serial PRIMARY KEY,
  academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  lesson_id integer NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  parent_id integer,
  contenido text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS academy_lesson_comments_lesson_idx ON academy_lesson_comments (lesson_id);
CREATE TABLE IF NOT EXISTS academy_course_reviews (
  id serial PRIMARY KEY,
  academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  course_id integer NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  estrellas integer NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  contenido text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_course_reviews_unica UNIQUE (course_id, user_id)
);
