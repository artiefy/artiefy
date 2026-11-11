CREATE TABLE IF NOT EXISTS academy_correo (
  id serial PRIMARY KEY,
  academy_id integer NOT NULL UNIQUE REFERENCES academies(id) ON DELETE CASCADE,
  proveedor text NOT NULL,
  host text NOT NULL,
  puerto integer NOT NULL,
  seguro boolean NOT NULL DEFAULT true,
  usuario text NOT NULL,
  clave_cifrada text NOT NULL,
  remitente_nombre text,
  verificado_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
