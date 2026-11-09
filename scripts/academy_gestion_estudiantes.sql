-- Gestión de Estudiantes de las academias (igual a "Gestión de Builders"):
--   * academy_estudiante_datos: datos de cada estudiante (teléfono, documento,
--     estado, cartera, origen, sede, horario… y columnas propias).
--   * academy_columnas: columnas que agrega cada academia.
--   * academy_comentarios: comentarios sobre cada estudiante.
-- Una sola sentencia; se puede correr varias veces.

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS academy_estudiante_datos (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    datos jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_estudiante_datos_unico UNIQUE (academy_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS academy_columnas (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    clave text NOT NULL,
    etiqueta text NOT NULL,
    opciones text[] NOT NULL DEFAULT '{}'::text[],
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_columnas_unica UNIQUE (academy_id, clave)
  );

  CREATE TABLE IF NOT EXISTS academy_comentarios (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    autor_id text NOT NULL,
    autor text NOT NULL,
    texto text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_comentarios_usuario_idx
    ON academy_comentarios (academy_id, user_id);
END $$;
