-- Academias: respuestas del formulario de inscripción público de cada academia
-- (<slug>.artiefy.com/inscripcion), que revisa el super-admin en
-- Estudiantes › Formulario.
--
-- Reversible con:
--   DROP TABLE academy_inscripciones;

CREATE TABLE IF NOT EXISTS academy_inscripciones (
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  nombre      text        NOT NULL,
  email       text        NOT NULL,
  telefono    text,
  documento   text,
  course_id   integer     REFERENCES academy_courses(id) ON DELETE SET NULL,
  mensaje     text,
  estado      text        NOT NULL DEFAULT 'nueva'
    CHECK (estado IN ('nueva', 'contactada', 'inscrita', 'descartada')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_inscripciones_academy_idx
  ON academy_inscripciones (academy_id);
