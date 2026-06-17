-- Custom SQL migration file for Guided Projects
-- This file was created to resolve the schema drift and follow the recommended migration process.

-- 1. Add the column to guided_projects
ALTER TABLE "guided_projects" ADD COLUMN IF NOT EXISTS "type_course_id" integer;

-- 2. Add the foreign key constraint
-- We use a DO block to make it idempotent (safe to run multiple times)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'guided_projects_type_course_id_types_courses_id_fk'
    ) THEN
        ALTER TABLE "guided_projects" 
        ADD CONSTRAINT "guided_projects_type_course_id_types_courses_id_fk" 
        FOREIGN KEY ("type_course_id") REFERENCES "types_courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;
