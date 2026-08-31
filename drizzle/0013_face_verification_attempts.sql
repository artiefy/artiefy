-- Intentos de verificación facial en el control de acceso.
--
-- Va en tabla aparte y NO en `access_logs` a propósito: allí `entry_time` es
-- obligatorio y la app deduce si alguien está dentro por la ausencia de
-- `exit_time`. Un intento denegado guardado ahí contaría como que la persona
-- entró, y rompería el cálculo de entrada/salida.

CREATE TABLE IF NOT EXISTS face_verification_attempts (
  id            serial PRIMARY KEY,

  -- Puede ser NULL: si no se identificó a nadie, igual queremos el registro.
  user_id       text REFERENCES users(id),

  -- Lo que se buscó (cédula, correo o nombre) tal cual lo tecleó el operador.
  search_term   text,

  granted       boolean NOT NULL,

  -- Distancia euclídea entre descriptores (0 = idéntico). Menor es mejor.
  -- NULL si ni siquiera se llegó a comparar.
  distance      real,

  -- Motivo cuando se deniega: 'sin_rostro' | 'sin_referencia' | 'no_coincide'
  reason        text,

  created_at    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS face_attempts_user_idx    ON face_verification_attempts (user_id);
CREATE INDEX IF NOT EXISTS face_attempts_created_idx ON face_verification_attempts (created_at DESC);
