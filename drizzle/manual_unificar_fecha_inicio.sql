-- ============================================================
-- Unifica users.fecha_inicio a "YYYY-MM-DD"
-- Algunas filas quedaron como "2024-07-13T00:00:00.000Z" (edición masiva
-- guardaba un Date en una columna de texto) y se veían como fechas distintas.
-- Ejecutar en Neon. Es seguro re-ejecutar.
-- ============================================================

-- 1) Revisar primero qué filas cambian (no modifica nada)
SELECT id, email, fecha_inicio, left(btrim(fecha_inicio), 10) AS queda
FROM users
WHERE fecha_inicio ~ '^\s*\d{4}-\d{2}-\d{2}.'
ORDER BY fecha_inicio;

-- 2) Unificar: deja solo el día
UPDATE users
SET fecha_inicio = left(btrim(fecha_inicio), 10),
    updated_at = now()
WHERE fecha_inicio ~ '^\s*\d{4}-\d{2}-\d{2}.';
