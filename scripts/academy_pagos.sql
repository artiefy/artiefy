-- Academias: pagos registrados por la academia (Finanzas), en pesos.
-- No pasa por PayU: es el registro manual de la cartera de sus estudiantes.
--
-- Reversible con:
--   DROP TABLE academy_pagos;

CREATE TABLE IF NOT EXISTS academy_pagos (
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  user_id     text        NOT NULL,
  concepto    text        NOT NULL,
  monto       integer     NOT NULL CHECK (monto >= 0),
  fecha       date        NOT NULL,
  metodo      text,
  estado      text        NOT NULL DEFAULT 'pagado'
    CHECK (estado IN ('pagado', 'pendiente', 'anulado')),
  created_by  text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_pagos_academy_idx
  ON academy_pagos (academy_id, user_id);
