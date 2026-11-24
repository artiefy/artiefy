CREATE TABLE IF NOT EXISTS academy_ajustes (
  id serial PRIMARY KEY,
  academy_id integer NOT NULL UNIQUE REFERENCES academies(id) ON DELETE CASCADE,
  favicon_key text,
  formulario_logos text[] NOT NULL DEFAULT '{}'::text[],
  formulario_fechas text[] NOT NULL DEFAULT '{}'::text[],
  formulario_comerciales text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Correo de la academia (sin contraseña): nombre del remitente y "Responder a".
ALTER TABLE academy_ajustes ADD COLUMN IF NOT EXISTS remitente_nombre text;
ALTER TABLE academy_ajustes ADD COLUMN IF NOT EXISTS correo_respuesta text;
