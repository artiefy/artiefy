ALTER TABLE courses
  ALTER COLUMN visibility DROP NOT NULL;

ALTER TABLE courses
  ALTER COLUMN visibility SET DEFAULT true;
