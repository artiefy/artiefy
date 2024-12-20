import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  serial,
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

// Tabla de cursos
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(), // ID autoincremental del curso
  title: varchar("title", { length: 255 }).notNull(), // Título del curso
  description: text("description"), // Descripción del curso
  coverImageKey: text("cover_image_key"), // Clave de la imagen en S3
  category: varchar("category", { length: 255 }).notNull(), // Categoría del curso
  instructor: text("instructor").notNull(), // Nombre del instructor
  createdAt: timestamp("created_at").defaultNow().notNull(), // Fecha de creación
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Fecha de última actualización
  creatorId: text("creator_id")
    .references(() => users.id)
    .notNull(), // Referencia al creador del curso (usuario existente)
});

// Tabla de lecciones
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(), // ID autoincremental de la lección
  title: varchar("title", { length: 255 }).notNull(), // Título de la lección
  content: text("content"), // Contenido de la lección
  order: integer("order").notNull(), // Orden de la lección en el curso
  courseId: integer("course_id")
    .references(() => courses.id)
    .notNull(), // Relación con la tabla cursos
  createdAt: timestamp("created_at").defaultNow().notNull(), // Fecha de creación
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Fecha de última actualización
});

// Tabla de inscripciones (relación muchos a muchos entre usuarios y cursos)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(), // ID autoincremental de la inscripción
  userId: text("user_id")
    .references(() => users.id)
    .notNull(), // Relación con usuarios
  courseId: integer("course_id")
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

export const coursesRelations = relations(courses, ({ many, one }) => ({
  lessons: many(lessons), // Relación con lecciones
  enrollments: many(enrollments), // Relación con inscripciones
  creator: one(users, {
    fields: [courses.creatorId], // Campo que referencia al creador
    references: [users.id], // ID del creador en usuarios
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