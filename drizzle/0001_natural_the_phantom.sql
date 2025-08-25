CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_custom_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"field_key" varchar(255) NOT NULL,
	"field_value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "categoryid" TO "category_id";--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_categoryid_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "fecha_inicio" date;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "fecha_fin" date;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tipo_visualizacion" text DEFAULT 'meses';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "projects_taken" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_custom_fields" ADD CONSTRAINT "user_custom_fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;