import { relations } from 'drizzle-orm';
import {
	boolean,
	integer,
	pgTable,
	real,
	serial,
	text,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core';

// Tabla de usuarios (con soporte para Clerk)
export const users = pgTable('users', {
	id: text('id').primaryKey(), // ID del usuario proporcionado por Clerk
	role: text('role').notNull(), // Rol del usuario (estudiante/profesor, etc.)
	name: text('name'), // Nombre opcional del usuario
	email: text('email').notNull(), // Email obligatorio
	createdAt: timestamp('created_at').defaultNow().notNull(), // Fecha de creación
	updatedAt: timestamp('updated_at').defaultNow().notNull(), // Fecha de última actualización
	// phone: text('phone'), // Teléfono opcional
	// country: text('country'), // País opcional
	// city: text('city'), // Ciudad opcional
	// address: text('address'), // Dirección opcional
	// age: integer('age'), // Edad opcional
	// birthDate: date('birth_date'), // Fecha de nacimiento opcional
});

// Tabla de cursos
export const courses = pgTable('courses', {
	id: serial('id').primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	coverImageKey: text('cover_image_key'),
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
	dificultadid: integer('dificultadid')
		.references(() => dificultad.id)
		.notNull(),
	requerimientos: text('requerimientos').notNull(),
});

// Tabla de categorías
export const categories = pgTable('categories', {
	id: serial('id').primaryKey(), // ID autoincremental de la categoría
	name: varchar('name', { length: 255 }).notNull(), // Nombre de la categoría
	description: text('description'), // Descripción de la categoría
	is_featured: boolean('is_featured').default(false), // Nuevo campo para destacar categorías
	// Tabla de lecciones
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

// Tabla de preferencias
export const preferences = pgTable('preferences', {
	id: serial('id').primaryKey(), // ID autoincremental de la preferencia
	name: varchar('name', { length: 255 }).notNull(), // Nombre de la preferencia
	area_cono: text('area_cono'), // Área de conocimiento
	userId: text('user_id')
		.references(() => users.id)
		.notNull(), // Relación con usuarios
	categoryid: integer('categoryid') // Usar el nombre consistente
		.references(() => categories.id)
		.notNull(),
});

//tabla de cursos tomados
export const coursesTaken = pgTable('courses_taken', {
	id: serial('id').primaryKey(), // ID autoincremental del curso tomado
	userId: text('user_id')
		.references(() => users.id)
		.notNull(), // Relación con usuarios
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(), // Relación con cursos
});

// Tabla de lecciones
export const lessons = pgTable('lessons', {
	id: serial('id').primaryKey(), // ID autoincremental de la lección
	title: varchar('title', { length: 255 }).notNull(), // Título de la lección
	description: text('description'), // Descripción de la lección
	duration: integer('duration').notNull(),
	coverImageKey: text('cover_image_key'), // Clave de la imagen en S3
	coverVideoKey: text('cover_video_key'), // Clave del video en S3
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(), // Relación con la tabla cursos
	createdAt: timestamp('created_at').defaultNow().notNull(), // Fecha de creación
	updatedAt: timestamp('updated_at').defaultNow().notNull(), // Fecha de última actualización
	lastUpdated: timestamp('last_updated').defaultNow().notNull(), // Fecha de última actualización
	resourceKey: text('resource_key'), // Clave del recurso en S3
	resourceNames: text('resource_names'), // Nombre del recurso
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

export const dificultad = pgTable('dificultad', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
});

// Agregamos una nueva tabla para el progreso de las actividades
export const activityProgress = pgTable('activity_progress', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	activityId: integer('activity_id')
		.references(() => activities.id)
		.notNull(),
	completed: boolean('completed').default(false),
	lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// Tabla de inscripciones (relación muchos a muchos entre usuarios y inscripciones)
export const enrollments = pgTable('enrollments', {
	id: serial('id').primaryKey(), // ID autoincremental de la inscripción
	userId: text('user_id')
		.references(() => users.id)
		.notNull(), // Relación con usuarios
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(), // Relación con cursos
	enrolledAt: timestamp('enrolled_at').defaultNow().notNull(), // Fecha de inscripción
	completed: boolean('completed').default(false), // Estado de completado
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

export const posts = pgTable('posts', {
	id: serial('id').primaryKey(),
	forumId: integer('forum_id')
		.references(() => forums.id)
		.notNull(),
	userId: text('user_id')
		.references(() => users.id)
		.notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date()),
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

export const dificultadRelations = relations(dificultad, ({ many }) => ({
	courses: many(courses),
}));

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
	dificultad: one(dificultad, {
		fields: [courses.dificultadid],
		references: [dificultad.id],
	}),
	category: one(categories, {
		fields: [courses.categoryid],
		references: [categories.id],
	}),
	coursesTaken: many(coursesTaken),
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
