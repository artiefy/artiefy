-- Registro de matrículas y desmatrículas en cursos (quién, cuándo, desde dónde).
-- Tabla nueva, no toca datos existentes. Sin ella la app sigue funcionando
-- (el registro falla en silencio).
CREATE TABLE IF NOT EXISTS enrollment_logs (
  id serial PRIMARY KEY,
  user_id text NOT NULL,
  course_id integer NOT NULL,
  accion text NOT NULL CHECK (accion IN ('matricula', 'desmatricula')),
  origen text NOT NULL,
  actor_id text,
  detalle text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enrollment_logs_user_idx ON enrollment_logs (user_id);
CREATE INDEX IF NOT EXISTS enrollment_logs_course_idx ON enrollment_logs (course_id);
