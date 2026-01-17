-- Agregar columnas faltantes a post_replies si no existen
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS image_key TEXT;
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS audio_key TEXT;
ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS video_key TEXT;

-- Verificar que las columnas existan en posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_key TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS audio_key TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_key TEXT;
