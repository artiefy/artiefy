-- Alinea el tipo de `activities.porcentaje` con lo que ya declara el esquema
-- de Drizzle (`real`) y con lo que necesita la aplicación.
--
-- Problema: la columna es `integer` en la base, pero el reparto automático de
-- peso entre las actividades de un parámetro produce decimales (3 actividades
-- => 33.33% cada una). Drizzle envía 33.33 y Postgres rechaza el insert.
--
-- La conversión de integer a real es segura y sin pérdida: los valores
-- existentes (enteros) se representan exactamente en punto flotante.

ALTER TABLE activities
  ALTER COLUMN porcentaje TYPE real USING porcentaje::real;
