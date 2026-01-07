-- Script para aplicar la migración de campos de educador
-- Ejecutar con: psql -U <usuario> -d <base_de_datos> -f apply-educador-migration.sql

\echo 'Aplicando migración: add-educador-fields.sql'
\i migrations/add-educador-fields.sql
\echo 'Migración aplicada exitosamente!'
