ALTER TABLE "document_embeddings" DROP CONSTRAINT "document_embeddings_unique";--> statement-breakpoint
ALTER TABLE "document_embeddings" ALTER COLUMN "course_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document_embeddings" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "type" text;--> statement-breakpoint
UPDATE "projects" SET "type" = CASE WHEN "course_id" IS NULL THEN 'user' ELSE 'course' END;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "type" SET DEFAULT 'course';--> statement-breakpoint
ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_project_id_guided_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."guided_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_embeddings_project_id_idx" ON "document_embeddings" USING btree ("project_id");