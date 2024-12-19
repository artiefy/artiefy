// src/models/courseModels.ts
import { db } from "~/server/db/index";
import { courses, lessons } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Crear un nuevo curso
export const createCourse = async (title: string, description: string, creatorId: string, coverImageKey: string) => {
  const result = await db.insert(courses).values({
    title,
    description,
    creatorId,
    coverImageKey,
  });
  return result;
};

// Obtener todos los cursos
export const getAllCourses = async () => {
  const result = await db.select().from(courses);
  return result;
};

// Obtener un curso por ID
export const getCourseById = async (courseId: number) => {
  const result = await db.select().from(courses).where(eq(courses.id, courseId));
  return result;
};

// Actualizar un curso
export const updateCourse = async (courseId: number, title: string, description: string, coverImageKey: string) => {
  const result = await db.update(courses).set({ title, description, coverImageKey }).where(eq(courses.id, courseId));
  return result;
};

// Eliminar un curso
export const deleteCourse = async (courseId: number) => {
  await db.delete(courses).where(eq(courses.id, courseId));
  await db.delete(lessons).where(eq(lessons.courseId, courseId)); // Eliminar lecciones asociadas
};
