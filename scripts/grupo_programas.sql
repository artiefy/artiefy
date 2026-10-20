-- Relación muchos-a-muchos entre hojas (grupos) y programas.
CREATE TABLE IF NOT EXISTS grupo_programas (
  id serial PRIMARY KEY,
  grupo_id integer NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  programa_id integer NOT NULL REFERENCES programas(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uniq_grupo_programa UNIQUE (grupo_id, programa_id)
);
CREATE INDEX IF NOT EXISTS grupo_programas_grupo_idx ON grupo_programas (grupo_id);
CREATE INDEX IF NOT EXISTS grupo_programas_programa_idx ON grupo_programas (programa_id);

-- Backfill: el programa (texto) actual de cada hoja pasa a la tabla nueva.
INSERT INTO grupo_programas (grupo_id, programa_id)
SELECT g.id, MIN(p.id)
FROM grupos g
JOIN programas p ON p.title = g.programa
WHERE g.programa IS NOT NULL
GROUP BY g.id
ON CONFLICT (grupo_id, programa_id) DO NOTHING;
