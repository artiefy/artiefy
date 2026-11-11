DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS academy_pago_verificacion (
    id serial PRIMARY KEY,
    pago_id integer NOT NULL UNIQUE REFERENCES academy_pagos(id) ON DELETE CASCADE,
    comprobante_key text,
    comprobante_nombre text,
    comprobante_subido_at timestamptz,
    verificado boolean NOT NULL DEFAULT false,
    verificado_at timestamptz,
    verificado_por text
  );
  CREATE TABLE IF NOT EXISTS academy_pago_historial (
    id serial PRIMARY KEY,
    pago_id integer NOT NULL REFERENCES academy_pagos(id) ON DELETE CASCADE,
    verificado boolean NOT NULL,
    por text,
    notas text,
    archivo_key text,
    archivo_nombre text,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_pago_historial_pago_idx
    ON academy_pago_historial (pago_id);
END $$;
