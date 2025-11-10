-- SQL para agregar la columna is_read a la tabla ticket_comments
ALTER TABLE ticket_comments
ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Si prefieres establecer el valor actual según el remitente (por ejemplo, marcar los mensajes existentes de 'user' como leídos):
-- UPDATE ticket_comments SET is_read = true WHERE sender = 'user';
