ALTER TABLE "document_embeddings" ALTER COLUMN "course_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document_embeddings" ALTER COLUMN "metadata" SET DATA TYPE jsonb USING "metadata"::jsonb;--> statement-breakpoint
ALTER TABLE "document_embeddings" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "document_embeddings" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_project_id_guided_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."guided_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_embeddings_project_id_idx" ON "document_embeddings" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_project_unique" UNIQUE("project_id","content","chunk_index");--> statement-breakpoint
UPDATE "document_embeddings" SET "metadata" = COALESCE("metadata", '{}'::jsonb) || jsonb_build_object('scope', 'course', 'courseId', "course_id"::text, 'projectId', NULL) WHERE "course_id" IS NOT NULL;
