-- Hoja (pestaña) archivada con "Archivar y duplicar": queda de solo lectura,
-- en rojo y al final de las pestañas. Distinto de grupos.archivado, que
-- archiva el grupo completo (la tarjeta del listado).
-- Reversible con:
--   ALTER TABLE grupos DROP COLUMN hoja_archivada;
ALTER TABLE grupos
  ADD COLUMN IF NOT EXISTS hoja_archivada boolean NOT NULL DEFAULT false;
