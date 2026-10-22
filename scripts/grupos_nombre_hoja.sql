-- Nombre propio para la pestaña de la hoja raíz de un grupo, separado del
-- nombre del grupo (el que se ve en la tarjeta del listado).
-- NULL = la pestaña sigue mostrando grupos.nombre. Reversible con:
--   ALTER TABLE grupos DROP COLUMN nombre_hoja;
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS nombre_hoja text;
