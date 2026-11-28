-- Aula del estudiante en las academias: progreso por clase y entregas de
-- actividades. Tablas nuevas; no tocan datos existentes.
CREATE TABLE IF NOT EXISTS academy_lesson_progress (
  id serial PRIMARY KEY,
  academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  lesson_id integer NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  progreso integer NOT NULL DEFAULT 0,
  completada boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_lesson_progress_unica UNIQUE (lesson_id, user_id)
);
CREATE INDEX IF NOT EXISTS academy_lesson_progress_user_idx ON academy_lesson_progress (academy_id, user_id);
CREATE TABLE IF NOT EXISTS academy_activity_submissions (
  id serial PRIMARY KEY,
  academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  activity_id integer NOT NULL REFERENCES academy_activities(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  texto text,
  enlace text,
  archivo_key text,
  archivo_nombre text,
  entregada_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_activity_submissions_unica UNIQUE (activity_id, user_id)
);
CREATE INDEX IF NOT EXISTS academy_activity_submissions_user_idx ON academy_activity_submissions (academy_id, user_id);
