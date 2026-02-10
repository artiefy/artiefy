-- Add requirements, duration_unit and unidad_tiempo fields to projects table
ALTER TABLE projects ADD COLUMN requirements text;

ALTER TABLE projects ADD COLUMN duration_unit varchar(50);
