CREATE TABLE "access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"entry_time" timestamp with time zone NOT NULL,
	"exit_time" timestamp with time zone,
	"subscription_status" text,
	"esp32_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer DEFAULT NULL,
	"programa_id" integer DEFAULT NULL,
	"grade" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"public_code" varchar(32),
	"student_name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "certification_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender" text NOT NULL,
	"sender_id" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"courses_data" jsonb DEFAULT 'null'::jsonb
);
--> statement-breakpoint
CREATE TABLE "class_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"start_datetime" timestamp with time zone NOT NULL,
	"end_datetime" timestamp with time zone NOT NULL,
	"join_url" varchar(1024),
	"week_number" integer,
	"created_at" timestamp DEFAULT now(),
	"meeting_id" varchar(255) NOT NULL,
	"video_key" varchar(255),
	"video_key_2" varchar(255),
	"progress" integer
);
--> statement-breakpoint
CREATE TABLE "comercials" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"status" text DEFAULT 'activo' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"curso_id" integer DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "course_course_types" (
	"course_id" integer NOT NULL,
	"course_type_id" integer NOT NULL,
	CONSTRAINT "course_course_types_course_id_course_type_id_pk" PRIMARY KEY("course_id","course_type_id")
);
--> statement-breakpoint
CREATE TABLE "course_instructors" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"instructor_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_instructor_unique" UNIQUE("course_id","instructor_id")
);
--> statement-breakpoint
CREATE TABLE "course_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"required_subscription_level" varchar(255) NOT NULL,
	"is_purchasable_individually" boolean DEFAULT false,
	"price" integer,
	"meta_pixel_id" text,
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
	"course_type_id" integer DEFAULT NULL,
	"individual_price" integer,
	"requires_program" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_top" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"embedding" vector(1536),
	"meta_pixel_id" text,
	"horario" text,
	"espacios" text,
	"schedule_option_id" integer DEFAULT NULL,
	"space_option_id" integer DEFAULT NULL,
	"certification_type_id" integer DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "courses_taken" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credentials_delivery_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"usuario" text NOT NULL,
	"contrasena" text,
	"correo" text NOT NULL,
	"nota" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"metadata" text DEFAULT '{}',
	"source" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_embeddings_unique" UNIQUE("course_id","content","chunk_index")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"email_type" text NOT NULL,
	"subject" text NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"error_details" jsonb,
	"recipient_name" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embedding_processing_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"document_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_chunks" integer NOT NULL,
	"processed_chunks" integer DEFAULT 0,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"course_id" integer DEFAULT NULL,
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
CREATE TABLE "horario" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
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
CREATE TABLE "n8n_chat_histories" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_marked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "pago_verificaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"pago_id" integer NOT NULL,
	"verified_by" text,
	"notes" text,
	"file_key" varchar(255),
	"file_url" varchar(512),
	"file_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"programa_id" integer,
	"concepto" varchar(100) NOT NULL,
	"nro_pago" integer NOT NULL,
	"fecha" date NOT NULL,
	"metodo" varchar(50) NOT NULL,
	"valor" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"receipt_key" varchar(255),
	"receipt_url" varchar(512),
	"receipt_name" varchar(255),
	"receipt_uploaded_at" timestamp with time zone,
	"receipt_verified" boolean DEFAULT false NOT NULL,
	"receipt_verified_at" timestamp with time zone,
	"receipt_verified_by" text,
	"verified_receipt_key" varchar(255),
	"verified_receipt_url" varchar(512),
	"verified_receipt_name" varchar(255)
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
CREATE TABLE "post_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_post_like" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "post_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"image_key" text,
	"audio_key" text,
	"video_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"forum_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"image_key" text,
	"audio_key" text,
	"video_key" text,
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
	"categoryid" integer NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"certification_type_id" integer DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "project_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"objective_id" integer,
	"description" text NOT NULL,
	"link_url" text,
	"start_date" date,
	"end_date" date,
	"deliverable_key" text,
	"deliverable_url" text,
	"deliverable_name" text,
	"deliverable_description" text,
	"deliverable_submitted_at" timestamp,
	"responsible_user_id" text,
	"hours_per_day" integer
);
--> statement-breakpoint
CREATE TABLE "project_activity_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"entregado" boolean DEFAULT false NOT NULL,
	"aprobado" boolean DEFAULT false NOT NULL,
	"entrega_url" text,
	"document_key" text,
	"document_name" text,
	"image_key" text,
	"image_name" text,
	"video_key" text,
	"video_name" text,
	"compressed_file_key" text,
	"compressed_file_name" text,
	"file_types" text,
	"total_files" integer DEFAULT 0,
	"comentario" text,
	"feedback" text,
	"entregado_at" timestamp DEFAULT now(),
	"aprobado_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_activity_user" UNIQUE("activity_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "project_added_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"section_id" varchar(255) NOT NULL,
	"section_name" varchar(255) NOT NULL,
	"section_content" text NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"invited_user_id" text NOT NULL,
	"project_id" integer NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invitation_message" text,
	"response_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_participation_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" integer NOT NULL,
	"request_type" text DEFAULT 'participation' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"request_message" text,
	"response_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"responded_by" text
);
--> statement-breakpoint
CREATE TABLE "project_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_phases_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "project_schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"month" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_type_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_type_id" integer NOT NULL,
	"phase_id" integer NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_project_type_phase" UNIQUE("project_type_id","phase_id"),
	CONSTRAINT "unique_project_type_order" UNIQUE("project_type_id","order")
);
--> statement-breakpoint
CREATE TABLE "project_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "project_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"project_step" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"planteamiento" text NOT NULL,
	"justificacion" text NOT NULL,
	"objetivo_general" text NOT NULL,
	"requirements" text,
	"cover_image_key" text,
	"cover_video_key" text,
	"type_project" varchar(255) NOT NULL,
	"project_type_id" integer DEFAULT NULL,
	"user_id" text NOT NULL,
	"course_id" integer DEFAULT NULL,
	"category_id" integer NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"needs_collaborators" boolean DEFAULT false NOT NULL,
	"public_comment" text,
	"fecha_inicio" date,
	"fecha_fin" date,
	"duration_unit" varchar(50),
	"tipo_visualizacion" text DEFAULT 'meses',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"horas_por_dia" integer,
	"total_horas" integer,
	"tiempo_estimado" integer,
	"dias_estimados" integer,
	"dias_necesarios" integer,
	"multimedia" text
);
--> statement-breakpoint
CREATE TABLE "projects_taken" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_invited" boolean DEFAULT false NOT NULL
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
CREATE TABLE "schedule_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text,
	"phone_numbers" jsonb NOT NULL,
	"message_text" text NOT NULL,
	"variables" jsonb,
	"wa_subject_text" text,
	"scheduled_time" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"error_message" text,
	"codigo_pais" varchar(10) DEFAULT '+57' NOT NULL,
	"user_id" text,
	"recurrence" text DEFAULT 'no-repeat',
	"recurrence_config" jsonb,
	"parent_id" integer,
	"is_recurring" boolean DEFAULT false,
	"last_occurrence" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"score" real NOT NULL,
	"user_id" text NOT NULL,
	"categoryid" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sede" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"location" text,
	"capacity" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sender" text DEFAULT 'support' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"comments" varchar(255),
	"description" text NOT NULL,
	"estado" text DEFAULT 'abierto' NOT NULL,
	"tipo" text NOT NULL,
	"email" text NOT NULL,
	"cover_image_key" text,
	"video_key" text,
	"document_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"title" varchar(50) NOT NULL
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
CREATE TABLE "user_cartera" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'inactivo' NOT NULL,
	"receipt_key" text,
	"receipt_name" text,
	"receipt_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "user_custom_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"field_key" varchar(255) NOT NULL,
	"field_value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_inscription_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"identificacion_tipo" text NOT NULL,
	"identificacion_numero" text NOT NULL,
	"nivel_educacion" text NOT NULL,
	"tiene_acudiente" text,
	"acudiente_nombre" text,
	"acudiente_contacto" text,
	"acudiente_email" text,
	"programa" text NOT NULL,
	"fecha_inicio" text NOT NULL,
	"comercial" text,
	"sede" text NOT NULL,
	"horario" text NOT NULL,
	"pago_inscripcion" text NOT NULL,
	"pago_cuota1" text NOT NULL,
	"modalidad" text NOT NULL,
	"numero_cuotas" text NOT NULL,
	"id_doc_key" text,
	"utility_bill_key" text,
	"diploma_key" text,
	"pagare_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_lessons_progress" (
	"user_id" text NOT NULL,
	"lesson_id" integer NOT NULL,
	"progress" real DEFAULT 0 NOT NULL,
	"last_position_seconds" real DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT true,
	"is_new" boolean DEFAULT true NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_user_lesson_progress" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "user_program_price" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"programa_id" integer NOT NULL,
	"price" numeric(12, 2) DEFAULT '150000' NOT NULL,
	"num_cuotas" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"enrollment_status" text DEFAULT 'Nuevo',
	"purchase_date" timestamp with time zone,
	"document" text,
	"modalidad" text,
	"inscripcion_valor" integer,
	"payment_method" text,
	"cuota1_fecha" date,
	"cuota1_metodo" text,
	"cuota1_valor" integer,
	"valor_programa" integer,
	"inscripcion_origen" text,
	"identificacion_tipo" text,
	"identificacion_numero" text,
	"nivel_educacion" text,
	"tiene_acudiente" text,
	"acudiente_nombre" text,
	"acudiente_contacto" text,
	"acudiente_email" text,
	"programa" text,
	"fecha_inicio" text,
	"comercial" text,
	"sede" text,
	"horario" text,
	"numero_cuotas" text,
	"pago_inscripcion" text,
	"pago_cuota1" text,
	"id_doc_key" text,
	"utility_bill_key" text,
	"diploma_key" text,
	"pagare_key" text,
	"profesion" text,
	"descripcion" text,
	"profile_image_key" text,
	CONSTRAINT "users_email_role_unique" UNIQUE("email","role")
);
--> statement-breakpoint
CREATE TABLE "wa_conversation_tags" (
	"waid" varchar(32) NOT NULL,
	"tag_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wa_conversation_tags_waid_tag_id_pk" PRIMARY KEY("waid","tag_id")
);
--> statement-breakpoint
CREATE TABLE "wa_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"meta_message_id" text,
	"waid" varchar(32) NOT NULL,
	"name" text,
	"direction" varchar(16) NOT NULL,
	"msg_type" varchar(32) NOT NULL,
	"body" text,
	"ts_ms" bigint NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"media_id" text,
	"media_type" text,
	"file_name" text,
	"session" varchar(50) DEFAULT 'soporte'
);
--> statement-breakpoint
CREATE TABLE "wa_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"color" varchar(16),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_type_id_type_acti_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."type_acti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lessons_id_lessons_id_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_parametro_id_parametros_id_fk" FOREIGN KEY ("parametro_id") REFERENCES "public"."parametros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_cursos" ADD CONSTRAINT "anuncios_cursos_anuncio_id_anuncios_id_fk" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_cursos" ADD CONSTRAINT "anuncios_cursos_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_programas" ADD CONSTRAINT "anuncios_programas_anuncio_id_anuncios_id_fk" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_usuarios" ADD CONSTRAINT "anuncios_usuarios_anuncio_id_anuncios_id_fk" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios_usuarios" ADD CONSTRAINT "anuncios_usuarios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_programa_id_programas_id_fk" FOREIGN KEY ("programa_id") REFERENCES "public"."programas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_meetings" ADD CONSTRAINT "class_meetings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_curso_id_courses_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_course_types" ADD CONSTRAINT "course_course_types_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_course_types" ADD CONSTRAINT "course_course_types_course_type_id_course_types_id_fk" FOREIGN KEY ("course_type_id") REFERENCES "public"."course_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_modalidadesid_modalidades_id_fk" FOREIGN KEY ("modalidadesid") REFERENCES "public"."modalidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_nivelid_nivel_id_fk" FOREIGN KEY ("nivelid") REFERENCES "public"."nivel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_course_type_id_course_types_id_fk" FOREIGN KEY ("course_type_id") REFERENCES "public"."course_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_schedule_option_id_schedule_options_id_fk" FOREIGN KEY ("schedule_option_id") REFERENCES "public"."schedule_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_space_option_id_space_options_id_fk" FOREIGN KEY ("space_option_id") REFERENCES "public"."space_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_certification_type_id_certification_types_id_fk" FOREIGN KEY ("certification_type_id") REFERENCES "public"."certification_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses_taken" ADD CONSTRAINT "courses_taken_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses_taken" ADD CONSTRAINT "courses_taken_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials_delivery_logs" ADD CONSTRAINT "credentials_delivery_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embedding_processing_log" ADD CONSTRAINT "embedding_processing_log_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "pago_verificaciones" ADD CONSTRAINT "pago_verificaciones_pago_id_pagos_id_fk" FOREIGN KEY ("pago_id") REFERENCES "public"."pagos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pago_verificaciones" ADD CONSTRAINT "pago_verificaciones_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_programa_id_programas_id_fk" FOREIGN KEY ("programa_id") REFERENCES "public"."programas"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_receipt_verified_by_users_id_fk" FOREIGN KEY ("receipt_verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_grades" ADD CONSTRAINT "parameter_grades_parametro_id_parametros_id_fk" FOREIGN KEY ("parametro_id") REFERENCES "public"."parametros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parameter_grades" ADD CONSTRAINT "parameter_grades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parametros" ADD CONSTRAINT "parametros_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_replies" ADD CONSTRAINT "post_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_forum_id_forums_id_fk" FOREIGN KEY ("forum_id") REFERENCES "public"."forums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programas" ADD CONSTRAINT "programas_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programas" ADD CONSTRAINT "programas_categoryid_categories_id_fk" FOREIGN KEY ("categoryid") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programas" ADD CONSTRAINT "programas_certification_type_id_certification_types_id_fk" FOREIGN KEY ("certification_type_id") REFERENCES "public"."certification_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_objective_id_specific_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."specific_objectives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activity_deliveries" ADD CONSTRAINT "project_activity_deliveries_activity_id_project_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."project_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activity_deliveries" ADD CONSTRAINT "project_activity_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_added_sections" ADD CONSTRAINT "project_added_sections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_participation_requests" ADD CONSTRAINT "project_participation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_participation_requests" ADD CONSTRAINT "project_participation_requests_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_participation_requests" ADD CONSTRAINT "project_participation_requests_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_schedule" ADD CONSTRAINT "project_schedule_activity_id_project_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."project_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_type_phases" ADD CONSTRAINT "project_type_phases_project_type_id_project_types_id_fk" FOREIGN KEY ("project_type_id") REFERENCES "public"."project_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_type_phases" ADD CONSTRAINT "project_type_phases_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_drafts" ADD CONSTRAINT "project_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_type_id_project_types_id_fk" FOREIGN KEY ("project_type_id") REFERENCES "public"."project_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_taken" ADD CONSTRAINT "projects_taken_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects_taken" ADD CONSTRAINT "projects_taken_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_secundario_permisos" ADD CONSTRAINT "role_secundario_permisos_role_id_roles_secundarios_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles_secundarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_secundario_permisos" ADD CONSTRAINT "role_secundario_permisos_permiso_id_permisos_id_fk" FOREIGN KEY ("permiso_id") REFERENCES "public"."permisos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_whatsapp_messages" ADD CONSTRAINT "scheduled_whatsapp_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "user_cartera" ADD CONSTRAINT "user_cartera_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_custom_fields" ADD CONSTRAINT "user_custom_fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inscription_details" ADD CONSTRAINT "user_inscription_details_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lessons_progress" ADD CONSTRAINT "user_lessons_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lessons_progress" ADD CONSTRAINT "user_lessons_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_program_price" ADD CONSTRAINT "user_program_price_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_program_price" ADD CONSTRAINT "user_program_price_programa_id_programas_id_fk" FOREIGN KEY ("programa_id") REFERENCES "public"."programas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_time_tracking" ADD CONSTRAINT "user_time_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_time_tracking" ADD CONSTRAINT "user_time_tracking_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wa_conversation_tags" ADD CONSTRAINT "wa_conversation_tags_tag_id_wa_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."wa_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_logs_user_idx" ON "access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "access_logs_entry_idx" ON "access_logs" USING btree ("entry_time");--> statement-breakpoint
CREATE INDEX "credentials_delivery_logs_email_idx" ON "credentials_delivery_logs" USING btree ("correo");--> statement-breakpoint
CREATE INDEX "credentials_delivery_logs_created_idx" ON "credentials_delivery_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "document_embeddings_course_id_idx" ON "document_embeddings" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_assignees_ticket_user_unique" ON "ticket_assignees" USING btree ("ticket_id","user_id");--> statement-breakpoint
CREATE INDEX "wa_ct_w_idx" ON "wa_conversation_tags" USING btree ("waid");--> statement-breakpoint
CREATE INDEX "wa_ct_t_idx" ON "wa_conversation_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "wa_messages_waid_ts_idx" ON "wa_messages" USING btree ("waid","ts_ms");--> statement-breakpoint
CREATE UNIQUE INDEX "wa_messages_meta_unique" ON "wa_messages" USING btree ("meta_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wa_tags_name_unique" ON "wa_tags" USING btree ("name");