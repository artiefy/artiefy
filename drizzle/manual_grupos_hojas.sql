-- Hojas como sub-grupos dentro de un grupo: una hoja es un grupo con parent_id.
ALTER TABLE grupos
  ADD COLUMN IF NOT EXISTS parent_id integer REFERENCES grupos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS grupos_parent_idx ON grupos (parent_id);
