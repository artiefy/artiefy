-- Agregar campos de recurrencia a scheduled_whatsapp_messages
-- Fecha: 2026-01-23

ALTER TABLE scheduled_whatsapp_messages
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'no-repeat',
ADD COLUMN IF NOT EXISTS recurrence_config JSONB,
ADD COLUMN IF NOT EXISTS parent_id INTEGER,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_occurrence TIMESTAMPTZ;

-- Crear índice para consultas de mensajes recurrentes
CREATE INDEX IF NOT EXISTS idx_scheduled_wa_recurring 
ON scheduled_whatsapp_messages(is_recurring, status, scheduled_time);

-- Comentarios
COMMENT ON COLUMN scheduled_whatsapp_messages.recurrence IS 'Tipo de recurrencia: no-repeat, daily, weekly-monday, monthly-first, yearly, weekdays, custom';
COMMENT ON COLUMN scheduled_whatsapp_messages.recurrence_config IS 'Configuración personalizada para recurrence=custom: {interval, unit, weekdays}';
COMMENT ON COLUMN scheduled_whatsapp_messages.parent_id IS 'ID del mensaje padre si es una instancia generada por recurrencia';
COMMENT ON COLUMN scheduled_whatsapp_messages.is_recurring IS 'True si el mensaje tiene recurrencia activa';
COMMENT ON COLUMN scheduled_whatsapp_messages.last_occurrence IS 'Última vez que se generó una instancia de este mensaje recurrente';
