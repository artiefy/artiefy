ALTER TABLE "forums" DROP CONSTRAINT "forums_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "forums" ALTER COLUMN "course_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "forums" ADD COLUMN "guided_project_id" integer;--> statement-breakpoint
ALTER TABLE "guided_projects" ADD COLUMN "certificate_description" text;--> statement-breakpoint
ALTER TABLE "guided_projects" ADD COLUMN "faq_items" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "forums" ADD CONSTRAINT "forums_guided_project_id_guided_projects_id_fk" FOREIGN KEY ("guided_project_id") REFERENCES "public"."guided_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forums" ADD CONSTRAINT "forums_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forums_course_id_idx" ON "forums" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "forums_guided_project_id_idx" ON "forums" USING btree ("guided_project_id");--> statement-breakpoint
ALTER TABLE "forums" ADD CONSTRAINT "forums_exactly_one_owner_check" CHECK (
        (
          "forums"."course_id" IS NOT NULL
          AND "forums"."guided_project_id" IS NULL
        )
        OR
        (
          "forums"."course_id" IS NULL
          AND "forums"."guided_project_id" IS NOT NULL
        )
      );