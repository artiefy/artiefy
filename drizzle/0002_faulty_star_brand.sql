UPDATE "guided_projects" gp
SET "instructor" = COALESCE(
  (
    SELECT u."id"
    FROM "users" u
    WHERE u."id" = gp."instructor"
      AND u."role" IN ('educador', 'super-admin')
    LIMIT 1
  ),
  (
    SELECT u."id"
    FROM "users" u
    WHERE u."id" = gp."creator_id"
      AND u."role" IN ('educador', 'super-admin')
    LIMIT 1
  ),
  (
    SELECT u."id"
    FROM "users" u
    WHERE u."role" = 'super-admin'
    LIMIT 1
  ),
  (
    SELECT u."id"
    FROM "users" u
    WHERE u."role" = 'educador'
    LIMIT 1
  ),
  gp."creator_id"
)
WHERE NOT EXISTS (
  SELECT 1
  FROM "users" u
  WHERE u."id" = gp."instructor"
    AND u."role" IN ('educador', 'super-admin')
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'guided_projects_instructor_users_id_fk'
      AND table_name = 'guided_projects'
  ) THEN
    ALTER TABLE "guided_projects"
      ADD CONSTRAINT "guided_projects_instructor_users_id_fk"
      FOREIGN KEY ("instructor")
      REFERENCES "public"."users"("id")
      ON DELETE no action
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guided_project_instructors" (
  "id" serial PRIMARY KEY NOT NULL,
  "guided_project_id" integer NOT NULL,
  "instructor_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "guided_project_instructor_unique"
    UNIQUE ("guided_project_id", "instructor_id")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'guided_project_instructors_guided_project_id_guided_projects_id_fk'
      AND table_name = 'guided_project_instructors'
  ) THEN
    ALTER TABLE "guided_project_instructors"
      ADD CONSTRAINT "guided_project_instructors_guided_project_id_guided_projects_id_fk"
      FOREIGN KEY ("guided_project_id")
      REFERENCES "public"."guided_projects"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'guided_project_instructors_instructor_id_users_id_fk'
      AND table_name = 'guided_project_instructors'
  ) THEN
    ALTER TABLE "guided_project_instructors"
      ADD CONSTRAINT "guided_project_instructors_instructor_id_users_id_fk"
      FOREIGN KEY ("instructor_id")
      REFERENCES "public"."users"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guided_project_instructors_project_id_idx"
  ON "guided_project_instructors"("guided_project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guided_project_instructors_instructor_id_idx"
  ON "guided_project_instructors"("instructor_id");
--> statement-breakpoint
INSERT INTO "guided_project_instructors" (
  "guided_project_id",
  "instructor_id",
  "created_at"
)
SELECT
  gp."id",
  gp."instructor",
  now()
FROM "guided_projects" gp
WHERE gp."instructor" IS NOT NULL
  AND gp."instructor" != ''
  AND EXISTS (
    SELECT 1
    FROM "users" u
    WHERE u."id" = gp."instructor"
      AND u."role" IN ('educador', 'super-admin')
  )
ON CONFLICT ("guided_project_id", "instructor_id") DO NOTHING;
