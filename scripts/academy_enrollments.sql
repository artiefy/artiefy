-- Academias: matrículas de estudiantes en cursos de la academia, y estado
-- activo/inactivo de las cuentas (como "Activar / Desactivar" en Artiefy).
-- Tablas aparte de enrollments (Artiefy).
--
-- Reversible con:
--   DROP TABLE academy_enrollments;
--   ALTER TABLE academy_users DROP COLUMN activo;

ALTER TABLE academy_users
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS academy_enrollments (
  id           serial PRIMARY KEY,
  academy_id   integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  course_id    integer     NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  -- Cuenta de Clerk del estudiante (fila de academy_users de esa academia).
  user_id      text        NOT NULL,
  completed    boolean     NOT NULL DEFAULT false,
  enrolled_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_enrollments_unica UNIQUE (course_id, user_id)
);

CREATE INDEX IF NOT EXISTS academy_enrollments_academy_user_idx
  ON academy_enrollments (academy_id, user_id);
