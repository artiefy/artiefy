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
});

// Tabla de categorías
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(), // ID autoincremental de la categoría
    name: varchar('name', { length: 255 }).notNull(), // Nombre de la categoría
    description: text('description'), // Descripción de la categoría
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
});

export const modalidades = pgTable('modalidades', {
    id: serial('id').primaryKey(), // ID autoincremental de la modalidad
    name: varchar('name', { length: 255 }).notNull(), // Nombre de la modalidad
    description: text('description'), // Descripción de la modalidad
});

// Tabla de puntajes
export const scores = pgTable('scores', {
    id: serial('id').primaryKey(), // ID autoincremental del puntaje
    score: real('score').notNull(), // Puntaje del usuario
    userId: text('user_id')
        .references(() => users.id)
        .notNull(), // Relación con usuarios
    categoryid: integer('categoryid')
        .references(() => categories.id)
        .notNull(),
});

export const dificultad = pgTable('dificultad', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
});

//tabla de actividades
export const activities = pgTable('activities', {
    id: serial('id').primaryKey(), // ID autoincremental de la actividad
    name: varchar('name', { length: 255 }).notNull(), // Nombre de la actividad
    description: text('description'), // Descripción de la actividad
    tipo: varchar('tipo', { length: 255 }).notNull(), // Tipo de actividad
    lessonsId: integer('lessons_id')
        .references(() => lessons.id)
        .notNull(), // Relación con lecciones
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

//Tabla de proyectos
export const projects = pgTable('projects', {
    id: serial('id').primaryKey(), // ID autoincremental del proyecto
    name: varchar('name', { length: 255 }).notNull(), // Nombre del proyecto
    description: text('description'), // Descripción del proyecto
    coverImageKey: text('cover_image_key'), // Clave de la imagen en S3
    coverVideoKey: text('cover_video_key'), // Clave del video en S3
    type_project: varchar('type_project', { length: 255 }).notNull(), // Tipo de proyecto
    userId: text('user_id')
        .references(() => users.id)
        .notNull(), // Relación con usuarios
    categoryid: integer('categoryid')
        .references(() => categories.id)
        .notNull(),
});

//Tabla de proyectos tomados
export const projectsTaken = pgTable('projects_taken', {
    id: serial('id').primaryKey(), // ID autoincremental del proyecto tomado
    userId: text('user_id')
        .references(() => users.id)
        .notNull(), // Relación con usuarios
    projectId: integer('project_id')
        .references(() => projects.id)
        .notNull(), // Relación con proyectos
});

// Relaciones
export const usersRelations = relations(users, ({ many }) => ({
    enrollments: many(enrollments), // Relación con inscripciones
    createdCourses: many(courses), // Relación con cursos creados
}));

export const coursesRelations = relations(courses, ({ many, one }) => ({
    lessons: many(lessons),
    enrollments: many(enrollments),
    creator: one(users, {
        fields: [courses.creatorId],
        references: [users.id],
    }),
    modalidad: one(modalidades, {
        fields: [courses.modalidadesid],
        references: [modalidades.id],
    }),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
    course: one(courses, {
        fields: [lessons.courseId], // Campo que referencia al curso
        references: [courses.id], // ID del curso
    }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    user: one(users, {
        fields: [enrollments.userId], // Campo que referencia al usuario
        references: [users.id], // ID del usuario
    }),
    course: one(courses, {
        fields: [enrollments.courseId], // Campo que referencia al curso
        references: [courses.id], // ID del curso
    }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
    lesson: one(lessons, {
        fields: [activities.lessonsId], // Campo que referencia a las lecciones
        references: [lessons.id], // ID de las lecciones
    }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
    user: one(users, {
        fields: [scores.userId], // Campo que referencia al usuario
        references: [users.id], // ID del usuario
    }),
    category: one(categories, {
        fields: [scores.categoryid], // Usar el nombre consistente
        references: [categories.id],
    }),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
    user: one(users, {
        fields: [preferences.userId],
        references: [users.id],
    }),
    category: one(categories, {
        fields: [preferences.categoryid], // Usar el nombre consistente
        references: [categories.id],
    }),
}));

export const coursesTakenRelations = relations(coursesTaken, ({ one }) => ({
    user: one(users, {
        fields: [coursesTaken.userId], // Campo que referencia al usuario
        references: [users.id], // ID del usuario
    }),
}));

// export const progressRelations = relations(progress, ({ one }) => ({
//   user: one(users, {
//     fields: [progress.userId], // Campo que referencia al usuario
//     references: [users.id], // ID del usuario
//   }),
//   lesson: one(lessons, {
//     fields: [progress.lessonId], // Campo que referencia a la lección
//     references: [lessons.id], // ID de la lección
//   }),
// }));

// export const certificatesRelations = relations(certificates, ({ one }) => ({
//   user: one(users, {
//     fields: [certificates.userId], // Campo que referencia al usuario
//     references: [users.id], // ID del usuario
//   }),
//   course: one(courses, {
//     fields: [certificates.courseId], // Campo que referencia al curso
//     references: [courses.id], // ID del curso
//   }),
// }));

// export const commentsRelations = relations(comments, ({ one }) => ({
//   user: one(users, {
//     fields: [comments.userId], // Campo que referencia al usuario
//     references: [users.id], // ID del usuario
//   }),
//   lesson: one(lessons, {
//     fields: [comments.lessonId], // Campo que referencia a la lección
//     references: [lessons.id], // ID de la lección
//   }),
// }));

export const categoriesRelations = relations(categories, ({ many }) => ({
    preferences: many(preferences), // Relación con preferencias
}));

export const modalidadesRelations = relations(modalidades, ({ many }) => ({
    courses: many(courses),
}));
