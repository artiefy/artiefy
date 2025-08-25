CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type_id" integer NOT NULL,
	"lessons_id" integer NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"revisada" boolean DEFAULT false,
	"parametro_id" integer,
	"porcentaje" integer,
	"fecha_maxima_entrega" timestamp
);
--> statement-breakpoint
CREATE TABLE "anuncios" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text NOT NULL,
	"cover_image_key" text NOT NULL,
	"activo" boolean DEFAULT true,
	"tipo_destinatario" text DEFAULT 'todos' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anuncios_cursos" (
	"id" serial PRIMARY KEY NOT NULL,
	"anuncio_id" integer NOT NULL,
	"course_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anuncios_programas" (
	"id" serial PRIMARY KEY NOT NULL,
	"anuncio_id" integer NOT NULL,
	"programa_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anuncios_usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"anuncio_id" integer NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_featured" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "chat_messages_with_conversation" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"receiver_id" text,
	"status" text DEFAULT 'activo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"required_subscription_level" varchar(255) NOT NULL,
	"is_purchasable_individually" boolean DEFAULT false,
	"price" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"cover_image_key" text DEFAULT NULL,
	"cover_video_course_key" text DEFAULT NULL,
	"categoryid" integer NOT NULL,
	"instructor" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" text NOT NULL,
	"rating" real DEFAULT 0,
	"modalidadesid" integer NOT NULL,
	"nivelid" integer NOT NULL,
	"course_type_id" integer NOT NULL,
	"individual_price" integer,
	"requires_program" boolean DEFAULT false,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "courses_taken" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollment_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"programa_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed" boolean DEFAULT false,
	"is_permanent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forums" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"user_id" text NOT NULL,
	"description" text,
	"cover_image_key" text,
	"document_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"cover_image_key" text NOT NULL,
	"cover_video_key" text NOT NULL,
	"course_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"resource_key" text NOT NULL,
	"resource_names" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materia_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"materia_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"grade" real NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "materia_grades_materia_id_user_id_pk" PRIMARY KEY("materia_id","user_id"),
	CONSTRAINT "uniq_materia_user" UNIQUE("materia_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "materias" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"programa_id" integer,
	"courseid" integer
);
--> statement-breakpoint
CREATE TABLE "modalidades" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "nivel" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"materia_id" integer NOT NULL,
	"nota" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parameter_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"parametro_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"grade" real NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_parameter_user" UNIQUE("parametro_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "parametros" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"porcentaje" integer NOT NULL,
	"course_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permisos" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"servicio" varchar(100) NOT NULL,
	"accion" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "programas" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"cover_image_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" text NOT NULL,
	"rating" real DEFAULT 0,
	"categoryid" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"month" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"planteamiento" text NOT NULL,
	"justificacion" text NOT NULL,
	"objetivo_general" text NOT NULL,
	"cover_image_key" text,
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
CREATE TABLE "role_secundario_permisos" (
	"role_id" integer NOT NULL,
	"permiso_id" integer NOT NULL,
	CONSTRAINT "role_secundario_permisos_role_id_permiso_id_pk" PRIMARY KEY("role_id","permiso_id")
);
--> statement-breakpoint
CREATE TABLE "roles_secundarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"score" real NOT NULL,
	"user_id" text NOT NULL,
	"categoryid" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specific_objectives" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_assignees" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"comments" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"estado" text DEFAULT 'abierto' NOT NULL,
	"tipo" text NOT NULL,
	"email" text NOT NULL,
	"cover_image_key" text,
	"video_key" text,
	"document_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "type_acti" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "user_activities_progress" (
	"user_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"progress" real DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"revisada" boolean,
	"attempt_count" integer DEFAULT 0,
	"final_grade" real,
	"last_attempt_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"password" text NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_lessons_progress" (
	"user_id" text NOT NULL,
	"lesson_id" integer NOT NULL,
	"progress" real DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT true,
	"is_new" boolean DEFAULT true NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_time_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL
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
	"birth_date" date,
	"subscription_status" text DEFAULT 'inactive' NOT NULL,
	"subscription_end_date" timestamp with time zone,
	"plan_type" text,
	"purchase_date" timestamp with time zone,
	CONSTRAINT "users_email_role_unique" UNIQUE("email","role")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_type_id_type_acti_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."type_acti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lessons_id_lessons_id_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_parametro_id_parametros_id_fk" FOREIGN KEY ("parametro_id") REFERENCES "public"."parametros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_cursos" ADD CONSTRAINT "anuncios_cursos_anuncio_id_anuncios_id_fk" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_cursos" ADD CONSTRAINT "anuncios_cursos_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_programas" ADD CONSTRAINT "anuncios_programas_anuncio_id_anuncios_id_fk" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_usuarios" ADD CONSTRAINT "anuncios_usuarios_anuncio_id_anuncios_id_fk" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_usuarios" ADD CONSTRAINT "anuncios_usuarios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages_with_conversation" ADD CONSTRAINT "chat_messages_with_conversation_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages_with_conversation" ADD CONSTRAINT "chat_messages_with_conversation_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_modalidadesid_modalidades_id_fk" FOREIGN KEY ("modalidadesid") REFERENCES "public"."modalidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_nivelid_nivel_id_fk" FOREIGN KEY ("nivelid") REFERENCES "public"."nivel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_course_type_id_course_types_id_fk" FOREIGN KEY ("course_type_id") REFERENCES "public"."course_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses_taken" ADD CONSTRAINT "courses_taken_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses_taken" ADD CONSTRAINT "courses_taken_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_programs" ADD CONSTRAINT "enrollment_programs_programa_id_programas_id_fk" FOREIGN KEY ("programa_id") REFERENCES "public"."programas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_programs" ADD CONSTRAINT "enrollment_programs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forums" ADD CONSTRAINT "forums_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forums" ADD CONSTRAINT "forums_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materia_grades" ADD CONSTRAINT "materia_grades_materia_id_materias_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materia_grades" ADD CONSTRAINT "materia_grades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materias" ADD CONSTRAINT "materias_programa_id_programas_id_fk" FOREIGN KEY ("programa_id") REFERENCES "public"."programas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materias" ADD CONSTRAINT "materias_courseid_courses_id_fk" FOREIGN KEY ("courseid") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_materia_id_materias_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_grades" ADD CONSTRAINT "parameter_grades_parametro_id_parametros_id_fk" FOREIGN KEY ("parametro_id") REFERENCES "public"."parametros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_grades" ADD CONSTRAINT "parameter_grades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros" ADD CONSTRAINT "parametros_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_forum_id_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programas" ADD CONSTRAINT "programas_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programas" ADD CONSTRAINT "programas_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_schedule" ADD CONSTRAINT "project_schedule_activity_id_project_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."project_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_taken" ADD CONSTRAINT "projects_taken_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_taken" ADD CONSTRAINT "projects_taken_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_secundario_permisos" ADD CONSTRAINT "role_secundario_permisos_role_id_roles_secundarios_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles_secundarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_secundario_permisos" ADD CONSTRAINT "role_secundario_permisos_permiso_id_permisos_id_fk" FOREIGN KEY ("permiso_id") REFERENCES "public"."permisos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specific_objectives" ADD CONSTRAINT "specific_objectives_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_assignees" ADD CONSTRAINT "ticket_assignees_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_assignees" ADD CONSTRAINT "ticket_assignees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities_progress" ADD CONSTRAINT "user_activities_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities_progress" ADD CONSTRAINT "user_activities_progress_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities_progress" ADD CONSTRAINT "user_activities_progress_revisada_activities_revisada_fk" FOREIGN KEY ("revisada") REFERENCES "public"."activities"("revisada") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lessons_progress" ADD CONSTRAINT "user_lessons_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lessons_progress" ADD CONSTRAINT "user_lessons_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_time_tracking" ADD CONSTRAINT "user_time_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_time_tracking" ADD CONSTRAINT "user_time_tracking_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;