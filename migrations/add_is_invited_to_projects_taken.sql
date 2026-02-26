-- Agregar columna is_invited a projects_taken
ALTER TABLE projects_taken
ADD COLUMN IF NOT EXISTS is_invited BOOLEAN DEFAULT false NOT NULL;