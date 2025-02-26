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
	date,
} from 'drizzle-orm/pg-core';

// Tabla de usuarios (con soporte para Clerk)
export const users = pgTable('users', {
	id: text('id').primaryKey(),
	role: text('role').notNull(),
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
	subscriptionStatus: text('subscription_status').default('inactive').notNull(),
	subscriptionEndDate: timestamp('subscription_end_date', {
		withTimezone: true, // Esto hace que PostgreSQL maneje la zona horaria
		mode: 'date',
	}),
});

// Tabla de categorías
export const categories = pgTable('categories', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
	is_featured: boolean('is_featured').default(false),
});

// Tabla de modalidades
export const modalidades = pgTable('modalidades', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	description: text('description'),
});

// Tabla de dificultad
export const dificultad = pgTable('dificultad', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
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
});

// Tabla de lecciones
export const lessons = pgTable('lessons', {
	id: serial('id').primaryKey(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	duration: integer('duration').notNull(),
	coverImageKey: text('cover_image_key').notNull(),
	coverVideoKey: text('cover_video_key').notNull(),
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	resourceKey: text('resource_key').notNull(),
	lastUpdated: timestamp('last_updated').defaultNow().notNull(),
	resourceNames: text('resource_names').notNull(),
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
	lastUpdated: timestamp('last_updated').defaultNow().notNull(),
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
