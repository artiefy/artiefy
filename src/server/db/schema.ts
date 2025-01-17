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
  order: serial('order').notNull(),
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  porcentajecompletado: real('porcentajecompletado').default(0),
  resourceKey: text('resource_key').notNull(),
  isLocked: boolean('is_locked').default(true),
  userProgress: real('user_progress').default(0),
  isCompleted: boolean('is_completed').default(false),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// Tabla de actividades
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  tipo: varchar('tipo', { length: 255 }).notNull(),
  lessonsId: integer('lessons_id')
    .references(() => lessons.id)
    .notNull(),
  isCompleted: boolean('is_completed').default(false),
  userProgress: real('user_progress').default(0),
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

<<<<<<< HEAD
export const modalidades = pgTable('modalidades', {
  id: serial('id').primaryKey(), // ID autoincremental de la modalidad
  name: varchar('name', { length: 255 }).notNull(), // Nombre de la modalidad
  description: text('description'), // Descripción de la modalidad
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
  coverImageKey: text('cover_image_key').notNull(), // Clave de la imagen en S3
  coverVideoKey: text('cover_video_key').notNull(), // Clave del video en S3
  order: serial('order').notNull(), // Orden autoincremental de la lección en el curso
  courseId: integer('course_id')
    .references(() => courses.id)
    .notNull(), // Relación con la tabla cursos
  createdAt: timestamp('created_at').defaultNow().notNull(), // Fecha de creación
  updatedAt: timestamp('updated_at').defaultNow().notNull(), // Fecha de última actualización
  porcentajecompletado: real('porcentajecompletado').default(0), // Nuevo campo de porcentaje completado
  resourceKey: text('resource_key').notNull(), // Clave del recurso en S3
  isLocked: boolean('is_locked').default(true),
});

// Agregamos una nueva tabla para el progreso de las lecciones
export const lessonProgress = pgTable('lesson_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  lessonId: integer('lesson_id')
    .references(() => lessons.id)
    .notNull(),
  progress: real('progress').default(0),
  completed: boolean('completed').default(false),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

=======
>>>>>>> main
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

// Relaciones
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  createdCourses: many(courses),
  preferences: many(preferences),
  scores: many(scores),
  coursesTaken: many(coursesTaken),
  projects: many(projects),
  projectsTaken: many(projectsTaken),
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
    relationName: 'createdCourses', // Añadimos el relationName aquí
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
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  lesson: one(lessons, {
    fields: [activities.lessonsId],
    references: [lessons.id],
  }),
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

