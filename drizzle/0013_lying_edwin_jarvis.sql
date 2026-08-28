CREATE TABLE "project_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"parent_id" integer,
	"user_id" text NOT NULL,
	"author_role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_feedback" ADD CONSTRAINT "project_feedback_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_feedback" ADD CONSTRAINT "project_feedback_parent_id_project_feedback_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."project_feedback"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_feedback" ADD CONSTRAINT "project_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_feedback_project_idx" ON "project_feedback" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_feedback_parent_idx" ON "project_feedback" USING btree ("parent_id");