-- Cursos de las academias: lo que les falta para ser iguales a Artiefy.
--   * academy_courses.rating            (rating 0-5 del modal de cursos)
--   * academy_course_instructors        (varios instructores por curso)
--   * academy_parametros                (parámetros de evaluación del curso)
--   * academy_lessons: portada, video y recursos (modal "Crear clase")
--   * academy_activities: calificable, parámetro, peso % y fecha de inicio
-- Necesita las tablas de academy_seed_completo.sql (lecciones y actividades).
-- Es UNA sola sentencia (DO $$ … $$) y se puede correr varias veces.

DO $$
BEGIN
  ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS rating real NOT NULL DEFAULT 0;

  CREATE TABLE IF NOT EXISTS academy_course_instructors (
    id serial PRIMARY KEY,
    course_id integer NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    CONSTRAINT academy_course_instructors_unico UNIQUE (course_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS academy_parametros (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    course_id integer NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    porcentaje integer NOT NULL,
    number_of_activities integer NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS academy_parametros_course_idx ON academy_parametros (course_id);

  ALTER TABLE academy_lessons ADD COLUMN IF NOT EXISTS cover_image_key text;
  ALTER TABLE academy_lessons ADD COLUMN IF NOT EXISTS cover_video_key text;
  ALTER TABLE academy_lessons ADD COLUMN IF NOT EXISTS resource_key text;
  ALTER TABLE academy_lessons ADD COLUMN IF NOT EXISTS resource_names text;

  ALTER TABLE academy_activities ADD COLUMN IF NOT EXISTS calificable boolean NOT NULL DEFAULT true;
  ALTER TABLE academy_activities ADD COLUMN IF NOT EXISTS parametro_id integer
    REFERENCES academy_parametros(id) ON DELETE SET NULL;
  ALTER TABLE academy_activities ADD COLUMN IF NOT EXISTS porcentaje real;
  ALTER TABLE academy_activities ADD COLUMN IF NOT EXISTS fecha_inicio timestamptz;
END $$;
