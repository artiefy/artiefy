-- Agregar campos para educadores
-- Fecha: 2025-12-19
-- Descripción: Agrega campos de profesión, descripción y foto de perfil para usuarios con rol educador

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profesion TEXT,
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS profile_image_key TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN users.profesion IS 'Profesión del educador (opcional)';
COMMENT ON COLUMN users.descripcion IS 'Descripción del educador, máximo 161 caracteres (opcional)';
COMMENT ON COLUMN users.profile_image_key IS 'Clave S3 de la imagen de perfil del educador (opcional)';
