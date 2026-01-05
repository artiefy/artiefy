-- Migración para crear la tabla access_logs
-- Ejecutar este SQL en tu base de datos PostgreSQL

CREATE TABLE IF NOT EXISTS access_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE,
  subscription_status TEXT, -- 'active' | 'inactive'
  esp32_status TEXT, -- 'success' | 'error' | 'timeout' | null
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS access_logs_user_idx ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS access_logs_entry_idx ON access_logs(entry_time);

-- Comentarios para documentación
COMMENT ON TABLE access_logs IS 'Registro de entradas y salidas de usuarios';
COMMENT ON COLUMN access_logs.user_id IS 'ID del usuario que accede';
COMMENT ON COLUMN access_logs.entry_time IS 'Fecha y hora de entrada';
COMMENT ON COLUMN access_logs.exit_time IS 'Fecha y hora de salida (null si aún está dentro)';
COMMENT ON COLUMN access_logs.subscription_status IS 'Estado de suscripción al momento del acceso';
COMMENT ON COLUMN access_logs.esp32_status IS 'Resultado de la operación ESP32';
