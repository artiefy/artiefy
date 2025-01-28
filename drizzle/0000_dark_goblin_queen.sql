CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"tipo" varchar(255) NOT NULL,
	"lessons_id" integer NOT NULL,
	"is_completed" boolean DEFAULT false,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"completed" boolean DEFAULT false,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_featured" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"cover_image_key" text,
	"categoryid" integer NOT NULL,
	"instructor" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" text NOT NULL,
	"rating" real DEFAULT 0,
	"modalidadesid" integer NOT NULL,
	"dificultadid" integer NOT NULL,
	"requerimientos" text
);
--> statement-breakpoint
CREATE TABLE "courses_taken" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dificultad" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "forums" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"user_id" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" integer NOT NULL,
	"progress" real DEFAULT 0,
	"completed" boolean DEFAULT false,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"cover_image_key" text NOT NULL,
	"cover_video_key" text NOT NULL,
	"order" serial NOT NULL,
	"course_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"porcentajecompletado" real DEFAULT 0,
	"resource_key" text NOT NULL,
	"resource_names" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modalidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"forum_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"area_cono" text,
	"user_id" text NOT NULL,
	"categoryid" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cover_image_key" text,
	"cover_video_key" text,
	"type_project" varchar(255) NOT NULL,
	"user_id" text NOT NULL,
	"categoryid" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects_taken" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"score" real NOT NULL,
	"user_id" text NOT NULL,
	"categoryid" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activities_progress" (
	"user_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"progress" real DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_lessons_progress" (
	"user_id" text NOT NULL,
	"lesson_id" integer NOT NULL,
	"progress" real DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT true,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"phone" text,
	"country" text,
	"city" text,
	"address" text,
	"age" integer,
	"birth_date" date
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lessons_id_lessons_id_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_progress" ADD CONSTRAINT "activity_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_progress" ADD CONSTRAINT "activity_progress_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_modalidadesid_modalidades_id_fk" FOREIGN KEY ("modalidadesid") REFERENCES "public"."modalidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_dificultadid_dificultad_id_fk" FOREIGN KEY ("dificultadid") REFERENCES "public"."dificultad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses_taken" ADD CONSTRAINT "courses_taken_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses_taken" ADD CONSTRAINT "courses_taken_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forums" ADD CONSTRAINT "forums_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forums" ADD CONSTRAINT "forums_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_forum_id_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_taken" ADD CONSTRAINT "projects_taken_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_taken" ADD CONSTRAINT "projects_taken_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities_progress" ADD CONSTRAINT "user_activities_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities_progress" ADD CONSTRAINT "user_activities_progress_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lessons_progress" ADD CONSTRAINT "user_lessons_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lessons_progress" ADD CONSTRAINT "user_lessons_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;