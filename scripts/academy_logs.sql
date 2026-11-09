-- Academias: registro de actividad (Estudiantes › Logs): cuentas creadas,
-- credenciales enviadas, cursos, configuración, tickets...
--
-- Reversible con:
--   DROP TABLE academy_logs;

CREATE TABLE IF NOT EXISTS academy_logs (
  id           serial PRIMARY KEY,
  academy_id   integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  actor_id     text,
  actor_email  text,
  accion       text        NOT NULL,
  detalle      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_logs_academy_idx
  ON academy_logs (academy_id, created_at);
