CREATE TABLE "guided_activity_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"request_id" varchar(36) NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_guided_activity_submission_activity_request" UNIQUE("user_id","activity_id","request_id")
);
--> statement-breakpoint
ALTER TABLE "guided_activity_submissions" ADD CONSTRAINT "guided_activity_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guided_activity_submissions" ADD CONSTRAINT "guided_activity_submissions_activity_id_guided_objective_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."guided_objective_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guided_activity_submission_activity_idx" ON "guided_activity_submissions" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "guided_activity_submission_user_activity_history_idx" ON "guided_activity_submissions" USING btree ("user_id","activity_id","submitted_at","id");
