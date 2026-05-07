CREATE TABLE IF NOT EXISTS types_courses (
  id serial PRIMARY KEY,
  type varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS types_programs (
  id serial PRIMARY KEY,
  type varchar(255) NOT NULL
);

INSERT INTO types_courses (type)
SELECT 'CURSO'
WHERE NOT EXISTS (
  SELECT 1 FROM types_courses WHERE type = 'CURSO'
);

INSERT INTO types_courses (type)
SELECT 'DIPLOMADO'
WHERE NOT EXISTS (
  SELECT 1 FROM types_courses WHERE type = 'DIPLOMADO'
);

INSERT INTO types_programs (type)
SELECT 'Educacion para Adultos'
WHERE NOT EXISTS (
  SELECT 1 FROM types_programs WHERE type = 'Educacion para Adultos'
);

INSERT INTO types_programs (type)
SELECT 'Tecnico laboral'
WHERE NOT EXISTS (
  SELECT 1 FROM types_programs WHERE type = 'Tecnico laboral'
);

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS visibility boolean DEFAULT true;

ALTER TABLE courses
  ALTER COLUMN visibility DROP NOT NULL;

ALTER TABLE courses
  ALTER COLUMN visibility SET DEFAULT true;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS id_types_courses integer REFERENCES types_courses(id);

ALTER TABLE programas
  ADD COLUMN IF NOT EXISTS id_types_programs integer REFERENCES types_programs(id);
