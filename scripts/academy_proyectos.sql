-- Academias: proyectos de los estudiantes dentro de los cursos de la academia.
--
-- Reversible con:
--   DROP TABLE academy_proyectos;

CREATE TABLE IF NOT EXISTS academy_proyectos (
  id           serial PRIMARY KEY,
  academy_id   integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  course_id    integer     NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  user_id      text        NOT NULL,
  titulo       text        NOT NULL,
  descripcion  text,
  enlace       text,
  estado       text        NOT NULL DEFAULT 'en progreso'
    CHECK (estado IN ('en progreso', 'entregado', 'aprobado')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_proyectos_academy_idx
  ON academy_proyectos (academy_id);
