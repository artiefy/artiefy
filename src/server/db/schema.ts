import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  serial,
  real,
} from "drizzle-orm/pg-core";

// Tabla de usuarios (con soporte para Clerk)
export const users = pgTable("users", {
  id: text("id").primaryKey(), // ID del usuario proporcionado por Clerk
  role: text("role").notNull(), // Rol del usuario (estudiante/profesor, etc.)
  name: text("name"), // Nombre opcional del usuario
  email: text("email").notNull(), // Email obligatorio
  createdAt: timestamp("created_at").defaultNow().notNull(), // Fecha de creación
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Fecha de última actualización
});

// Tabla de categorías
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(), // ID autoincremental de la categoría
  name: varchar("name", { length: 255 }).notNull(), // Nombre de la categoría
  description: text("description"), // Descripción de la categoría
});

// Tabla de cursos
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(), // ID autoincremental del curso
  title: varchar("title", { length: 255 }).notNull(), // Título del curso
  description: text("description"), // Descripción del curso
  coverImageKey: text("cover_image_key"), // Clave de la imagen en S3
  categoryid: integer("categoryid")
    .references(() => categories.id)
    .notNull(), // Relación con la tabla categorías
  instructor: text("instructor").notNull(), // Nombre del instructor
  createdAt: timestamp("created_at").defaultNow().notNull(), // Fecha de creación
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Fecha de última actualización
  creatorId: text("creator_id")
    .references(() => users.id)
    .notNull(), // Referencia al creador del curso (usuario existente)
  rating: real("rating").default(0), // Nuevo campo de rating
});

// Tabla de lecciones
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(), // ID autoincremental de la lección
  title: varchar("title", { length: 255 }).notNull(), // Título de la lección
  duration: real("duration").notNull(), // Duración de la lección en horas
  description: text("description"), // Descripción de la lección
  order: integer("order").notNull(), // Orden de la lección en el curso
  course_id: integer("course_id")
    .references(() => courses.id)
    .notNull(), // Relación con la tabla cursos
  createdAt: timestamp("created_at").defaultNow().notNull(), // Fecha de creación
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Fecha de última actualización
});

// Tabla de inscripciones (relación muchos a muchos entre usuarios y cursos)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(), // ID autoincremental de la inscripción
  user_id: text("user_id")
    .references(() => users.id)
    .notNull(), // Relación con usuarios
  course_id: integer("course_id")
    .references(() => courses.id)
    .notNull(), // Relación con cursos
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(), // Fecha de inscripción
  completed: boolean("completed").default(false), // Estado de completado
});

// Relaciones
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments), // Relación con inscripciones
  createdCourses: many(courses), // Relación con cursos creados
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses), // Relación con cursos
}));

export const coursesRelations = relations(courses, ({ many, one }) => ({
  lessons: many(lessons), // Relación con lecciones
  enrollments: many(enrollments), // Relación con inscripciones
  creator: one(users, {
    fields: [courses.creatorId], // Campo que referencia al creador
    references: [users.id], // ID del creador en usuarios
  }),
  category: one(categories, {
    fields: [courses.categoryid], // Campo que referencia a la categoría
    references: [categories.id], // ID de la categoría en categorías
  }),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, {
    fields: [lessons.course_id], // Campo que referencia al curso
    references: [courses.id], // ID del curso
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.user_id], // Campo que referencia al usuario
    references: [users.id], // ID del usuario
  }),
  course: one(courses, {
    fields: [enrollments.course_id], // Campo que referencia al curso
    references: [courses.id], // ID del curso
  }),
}));