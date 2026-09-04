ALTER TABLE "guided_projects" ADD COLUMN IF NOT EXISTS "is_individual_purchase" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "guided_enrollments" ADD COLUMN IF NOT EXISTS "purchase_reference" text;
--> statement-breakpoint
ALTER TABLE "guided_enrollments" ADD COLUMN IF NOT EXISTS "purchase_amount" integer;
--> statement-breakpoint
ALTER TABLE "guided_enrollments" ADD COLUMN IF NOT EXISTS "purchased_at" timestamp;
