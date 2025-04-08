import { relations, sql } from 'drizzle-orm';
import {
	boolean,
	integer,
	pgTable,
	real,
	serial,
	text,
	timestamp,
	varchar,
	date,
	unique,
	primaryKey,
} from 'drizzle-orm/pg-core';

// Tabla de usuarios (con soporte para Clerk)
export const users = pgTable(
	'users',
	{
		id: text('id').primaryKey(),
		role: text('role', {
			enum: ['estudiante', 'educador', 'admin', 'super-admin'],
		}).notNull(),
		name: text('name'),
		email: text('email').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		phone: text('phone'),
		country: text('country'),
		city: text('city'),
		address: text('address'),
		age: integer('age'),
		birthDate: date('birth_date'),
		subscriptionStatus: text('subscription_status')
			.default('inactive')
			.notNull(),
		subscriptionEndDate: timestamp('subscription_end_date', {
			withTimezone: true,
			mode: 'date',
		}),
		planType: text('plan_type', { enum: ['Pro', 'Premium', 'Enterprise'] }),
		purchaseDate: timestamp('purchase_date', {
			withTimezone: true,
			mode: 'date',
		}),
	},
	(table) => [unique('users_email_role_unique').on(table.email, table.role)]
);

// Tabla de categorías
export const categories = pgTable('categories', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	is_featured: boolean('is_featured').default(false),
});

// Tabla de nivel
export const nivel = pgTable('nivel', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
});

// Tabla de cursos
export const courses = pgTable('courses', {
	id: serial('id').primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	coverImageKey: text('cover_image_key').default(sql`NULL`), // Changed from .default(null)
	categoryid: integer('categoryid')
		.references(() => categories.id)
		.notNull(),
	instructor: text('instructor').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	creatorId: text('creator_id')
		.references(() => users.id)
		.notNull(),
	rating: real('rating').default(0),
	modalidadesid: integer('modalidadesid')
		.references(() => modalidades.id)
		.notNull(),
	nivelid: integer('nivelid')
		.references(() => nivel.id)
		.notNull(),
	courseTypeId: integer('course_type_id')
		.references(() => courseTypes.id)
		.notNull(),
	individualPrice: integer('individual_price'),
	requiresProgram: boolean('requires_program').default(false),
	isActive: boolean('is_active').default(true),
});

// Tabla de tipos de actividades
export const typeActi = pgTable('type_acti', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
});

// Tabla de actividades
export const activities = pgTable('activities', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	typeid: integer('type_id')
		.references(() => typeActi.id)
		.notNull(),
	lessonsId: integer('lessons_id')
		.references(() => lessons.id)
		.notNull(),
	lastUpdated: timestamp('last_updated').defaultNow().notNull(),
	revisada: boolean('revisada').default(false),
	parametroId: integer('parametro_id').references(() => parametros.id),
	porcentaje: integer('porcentaje'),
	fechaMaximaEntrega: timestamp('fecha_maxima_entrega'),
});

// Tabla de inscripciones
export const enrollments = pgTable('enrollments', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(),
	enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
	completed: boolean('completed').default(false),
});

// Tabla de preferencias
export const preferences = pgTable('preferences', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	area_cono: text('area_cono'),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	categoryid: integer('categoryid')
		.references(() => categories.id)
		.notNull(),
});

// Tabla de lecciones
export const lessons = pgTable('lessons', {
	id: serial('id').primaryKey(), // ID autoincremental de la lección
	title: varchar('title', { length: 255 }).notNull(), // Título de la lección
	description: text('description'), // Descripción de la lección
	duration: integer('duration').notNull(),
	coverImageKey: text('cover_image_key').notNull(), // Clave de la imagen en S3
	coverVideoKey: text('cover_video_key').notNull(), // Clave del video en S3
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(), // Relación con la tabla cursos
	createdAt: timestamp('created_at').defaultNow().notNull(), // Fecha de creación
	updatedAt: timestamp('updated_at').defaultNow().notNull(), // Fecha de última actualización
	lastUpdated: timestamp('last_updated').defaultNow().notNull(), // Fecha de última actualización
	resourceKey: text('resource_key').notNull(), // Clave del recurso en S3
	resourceNames: text('resource_names').notNull(), // Nombre del recurso
});

export const modalidades = pgTable('modalidades', {
	id: serial('id').primaryKey(), // ID autoincremental de la modalidad
	name: varchar('name', { length: 255 }).notNull(), // Nombre de la modalidad
	description: text('description'), // Descripción de la modalidad
});

// Tabla de puntajes
export const scores = pgTable('scores', {
	id: serial('id').primaryKey(),
	score: real('score').notNull(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	categoryid: integer('categoryid')
		.references(() => categories.id)
		.notNull(),
});

// Tabla de cursos tomados
export const coursesTaken = pgTable('courses_taken', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(),
});

// Tabla de proyectos
export const projects = pgTable('projects', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	coverImageKey: text('cover_image_key'),
	coverVideoKey: text('cover_video_key'),
	type_project: varchar('type_project', { length: 255 }).notNull(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	categoryid: integer('categoryid')
		.references(() => categories.id)
		.notNull(),
});

// Tabla de proyectos tomados
export const projectsTaken = pgTable('projects_taken', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	projectId: integer('project_id')
		.references(() => projects.id)
		.notNull(),
});

// Tabla de progreso de lecciones por usuario
export const userLessonsProgress = pgTable('user_lessons_progress', {
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	lessonId: integer('lesson_id')
		.references(() => lessons.id)
		.notNull(),
	progress: real('progress').default(0).notNull(),
	isCompleted: boolean('is_completed').default(false).notNull(),
	isLocked: boolean('is_locked').default(true),
	isNew: boolean('is_new').default(true).notNull(),
	lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

//tabla de foros
export const forums = pgTable('forums', {
	id: serial('id').primaryKey(),
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(), // Relación con el curso
	title: varchar('title', { length: 255 }).notNull(), // Título del foro (por ejemplo, "Discusiones del curso X")
	userId: text('user_id')
		.references(() => users.id)
		.notNull(), // El usuario que crea el foro
	description: text('description'), // Descripción opcional del foro
	createdAt: timestamp('created_at').defaultNow().notNull(), // Fecha de creación
	updatedAt: timestamp('updated_at').defaultNow().notNull(), // Fecha de última actualización
});

//tabla de posts
export const posts = pgTable('posts', {
	id: serial('id').primaryKey(),
	forumId: integer('forum_id')
		.references(() => forums.id)
		.notNull(), // Relación con el foro
	userId: text('user_id')
		.references(() => users.id)
		.notNull(), // El usuario que hace el post
	content: text('content').notNull(), // Contenido del post
	createdAt: timestamp('created_at').defaultNow().notNull(), // Fecha de creación
	updatedAt: timestamp('updated_at').defaultNow().notNull(), // Fecha de última actualización
});

export const postReplies = pgTable('post_replies', {
	id: serial('id').primaryKey(),
	postId: integer('post_id')
		.references(() => posts.id)
		.notNull(), // Relaciona la respuesta con el post original
	userId: text('user_id')
		.references(() => users.id)
		.notNull(), // El usuario que hace la respuesta
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date()),
});

// Tabla de progreso de actividades por usuario
export const userActivitiesProgress = pgTable('user_activities_progress', {
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	activityId: integer('activity_id')
		.references(() => activities.id)
		.notNull(),
	progress: real('progress').default(0).notNull(),
	isCompleted: boolean('is_completed').default(false).notNull(),
	lastUpdated: timestamp('last_updated').defaultNow().notNull(),
	revisada: boolean('revisada').references(() => activities.revisada),
	attemptCount: integer('attempt_count').default(0),
	finalGrade: real('final_grade'),
	lastAttemptAt: timestamp('last_attempt_at'),
});

//Tabla de sistema de tickets
export const tickets = pgTable('tickets', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	comments: varchar('comments', { length: 255 }).notNull(),
	description: text('description').notNull(),
	estado: boolean('estado').default(false).notNull(),
	email: text('email').notNull(),
	coverImageKey: text('cover_image_key'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

//Tabla de parametros
export const parametros = pgTable('parametros', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description').notNull(),
	porcentaje: integer('porcentaje').notNull(),
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(),
});

export const programas = pgTable('programas', {
	id: serial('id').primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	coverImageKey: text('cover_image_key'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	creatorId: text('creator_id')
		.references(() => users.id)
		.notNull(),
	rating: real('rating').default(0),
	categoryid: integer('categoryid')
		.references(() => categories.id)
		.notNull(),
});

// Tabla de materias
export const materias = pgTable('materias', {
	id: serial('id').primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	programaId: integer('programa_id').references(() => programas.id),
	courseid: integer('courseid').references(() => courses.id), // courseid can be null
});

export const courseTypes = pgTable('course_types', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	requiredSubscriptionLevel: varchar('required_subscription_level', {
		length: 255,
		enum: ['none', 'pro', 'premium'],
	}).notNull(),
	isPurchasableIndividually: boolean('is_purchasable_individually').default(
		false
	),
	price: integer('price'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const materiaGrades = pgTable(
	'materia_grades',
	{
		id: serial('id').primaryKey(),
		materiaId: integer('materia_id')
			.references(() => materias.id)
			.notNull(),
		userId: text('user_id')
			.references(() => users.id)
			.notNull(),
		grade: real('grade').notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.materiaId, table.userId] }),
		unique('uniq_materia_user').on(table.materiaId, table.userId),
	]
);

export const parameterGrades = pgTable(
	'parameter_grades',
	{
		id: serial('id').primaryKey(),
		parameterId: integer('parametro_id')
			.references(() => parametros.id)
			.notNull(),
		userId: text('user_id')
			.references(() => users.id)
			.notNull(),
		grade: real('grade').notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => [unique('uniq_parameter_user').on(table.parameterId, table.userId)]
);

// Relaciones de programas
export const programasRelations = relations(programas, ({ one, many }) => ({
	creator: one(users, {
		fields: [programas.creatorId],
		references: [users.id],
	}),
	category: one(categories, {
		fields: [programas.categoryid],
		references: [categories.id],
	}),
	materias: many(materias),
}));

// Relaciones de materias
export const materiasRelations = relations(materias, ({ one }) => ({
	programa: one(programas, {
		fields: [materias.programaId],
		references: [programas.id],
	}),
	curso: one(courses, {
		fields: [materias.courseid], // Changed from courseId to courseid
		references: [courses.id],
	}),
}));

// Add courses relations for materias
export const coursesRelations = relations(courses, ({ many, one }) => ({
	lessons: many(lessons),
	enrollments: many(enrollments),
	creator: one(users, {
		fields: [courses.creatorId],
		references: [users.id],
		relationName: 'createdCourses',
	}),
	modalidad: one(modalidades, {
		fields: [courses.modalidadesid],
		references: [modalidades.id],
	}),
	nivel: one(nivel, {
		fields: [courses.nivelid],
		references: [nivel.id],
	}),
	category: one(categories, {
		fields: [courses.categoryid],
		references: [categories.id],
	}),
	coursesTaken: many(coursesTaken),
	materias: many(materias), // Asegurarnos que esta relación está presente
	courseType: one(courseTypes, {
		fields: [courses.courseTypeId],
		references: [courseTypes.id],
	}),
}));

// Tabla de notas
export const notas = pgTable('notas', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	materiaId: integer('materia_id')
		.references(() => materias.id)
		.notNull(),
	nota: real('nota').notNull(),
});

// Relaciones de notas
export const notasRelations = relations(notas, ({ one }) => ({
	user: one(users, {
		fields: [notas.userId],
		references: [users.id],
	}),
	materia: one(materias, {
		fields: [notas.materiaId],
		references: [materias.id],
	}),
}));

// Tabla de inscripción a programas
export const enrollmentPrograms = pgTable('enrollment_programs', {
	id: serial('id').primaryKey(),
	programaId: integer('programa_id')
		.references(() => programas.id)
		.notNull(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
	completed: boolean('completed').default(false),
});

// Relaciones de enrollmentPrograms
export const enrollmentProgramsRelations = relations(
	enrollmentPrograms,
	({ one }) => ({
		programa: one(programas, {
			fields: [enrollmentPrograms.programaId],
			references: [programas.id],
		}),
		user: one(users, {
			fields: [enrollmentPrograms.userId],
			references: [users.id],
		}),
	})
);

// Relaciones
export const usersRelations = relations(users, ({ many }) => ({
	enrollments: many(enrollments),
	createdCourses: many(courses),
	preferences: many(preferences),
	scores: many(scores),
	coursesTaken: many(coursesTaken),
	projects: many(projects),
	projectsTaken: many(projectsTaken),
	userLessonsProgress: many(userLessonsProgress),
	userActivitiesProgress: many(userActivitiesProgress),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
	courses: many(courses),
	preferences: many(preferences),
	scores: many(scores),
	projects: many(projects),
}));

export const modalidadesRelations = relations(modalidades, ({ many }) => ({
	courses: many(courses),
}));

export const nivelRelations = relations(nivel, ({ many }) => ({
	courses: many(courses),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
	course: one(courses, {
		fields: [lessons.courseId],
		references: [courses.id],
	}),
	activities: many(activities),
	userLessonsProgress: many(userLessonsProgress),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
	lesson: one(lessons, {
		fields: [activities.lessonsId],
		references: [lessons.id],
	}),
	parametro: one(parametros, {
		fields: [activities.parametroId],
		references: [parametros.id],
	}),
	typeActi: one(typeActi, {
		fields: [activities.typeid],
		references: [typeActi.id],
	}),
	userActivitiesProgress: many(userActivitiesProgress),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
	user: one(users, {
		fields: [enrollments.userId],
		references: [users.id],
	}),
	course: one(courses, {
		fields: [enrollments.courseId],
		references: [courses.id],
	}),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
	user: one(users, {
		fields: [preferences.userId],
		references: [users.id],
	}),
	category: one(categories, {
		fields: [preferences.categoryid],
		references: [categories.id],
	}),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
	user: one(users, {
		fields: [scores.userId],
		references: [users.id],
	}),
	category: one(categories, {
		fields: [scores.categoryid],
		references: [categories.id],
	}),
}));

export const coursesTakenRelations = relations(coursesTaken, ({ one }) => ({
	user: one(users, {
		fields: [coursesTaken.userId],
		references: [users.id],
	}),
	course: one(courses, {
		fields: [coursesTaken.courseId],
		references: [courses.id],
	}),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
	user: one(users, {
		fields: [projects.userId],
		references: [users.id],
	}),
	category: one(categories, {
		fields: [projects.categoryid],
		references: [categories.id],
	}),
	projectsTaken: many(projectsTaken),
}));

export const projectsTakenRelations = relations(projectsTaken, ({ one }) => ({
	user: one(users, {
		fields: [projectsTaken.userId],
		references: [users.id],
	}),
	project: one(projects, {
		fields: [projectsTaken.projectId],
		references: [projects.id],
	}),
}));

export const userLessonsProgressRelations = relations(
	userLessonsProgress,
	({ one }) => ({
		user: one(users, {
			fields: [userLessonsProgress.userId],
			references: [users.id],
		}),
		lesson: one(lessons, {
			fields: [userLessonsProgress.lessonId],
			references: [lessons.id],
		}),
	})
);

export const userActivitiesProgressRelations = relations(
	userActivitiesProgress,
	({ one }) => ({
		user: one(users, {
			fields: [userActivitiesProgress.userId],
			references: [users.id],
		}),
		activity: one(activities, {
			fields: [userActivitiesProgress.activityId],
			references: [activities.id],
		}),
	})
);

//relaciones de foros
export const forumRelations = relations(forums, ({ one, many }) => ({
	course: one(courses, {
		fields: [forums.courseId],
		references: [courses.id],
	}), // Un foro está asociado a un solo curso (relación uno a uno)
	posts: many(posts), // Un foro puede tener muchos posts (comentarios o temas de discusión)
}));

export const postRelations = relations(posts, ({ one }) => ({
	forum: one(forums, {
		fields: [posts.forumId],
		references: [forums.id],
	}), // Un post pertenece a un foro
	user: one(users, {
		fields: [posts.userId],
		references: [users.id],
	}), // Un post tiene un usuario creador
}));

export const userTimeTracking = pgTable('user_time_tracking', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	date: date('date').defaultNow().notNull(),
	timeSpent: integer('time_spent').default(0).notNull(),
});

export const anuncios = pgTable('anuncios', {
	id: serial('id').primaryKey(),
	titulo: text('titulo').notNull(),
	descripcion: text('descripcion').notNull(),
	cover_image_key: text('cover_image_key').notNull(),
	activo: boolean('activo').default(true),
	tipo_destinatario: text('tipo_destinatario').notNull().default('todos'), // Puede ser 'todos', 'cursos', 'programas', 'custom'
});

export const anunciosCursos = pgTable('anuncios_cursos', {
	id: serial('id').primaryKey(),
	anuncioId: integer('anuncio_id')
		.references(() => anuncios.id)
		.notNull(),
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(),
});

export const anunciosProgramas = pgTable('anuncios_programas', {
	id: serial('id').primaryKey(),
	anuncioId: integer('anuncio_id')
		.references(() => anuncios.id)
		.notNull(),
	programaId: integer('programa_id') // Reemplaza esto con la clave de la tabla de programas
		.notNull(),
});

export const anunciosUsuarios = pgTable('anuncios_usuarios', {
	id: serial('id').primaryKey(),
	anuncioId: integer('anuncio_id')
		.references(() => anuncios.id)
		.notNull(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
});

export const courseTypesRelations = relations(courseTypes, ({ many }) => ({
	courses: many(courses),
}));

export const materiaGradesRelations = relations(materiaGrades, ({ one }) => ({
	materia: one(materias, {
		fields: [materiaGrades.materiaId],
		references: [materias.id],
	}),
	user: one(users, {
		fields: [materiaGrades.userId],
		references: [users.id],
	}),
}));
