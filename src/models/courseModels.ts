import { db } from "~/server/db/index";
import { courses, lessons, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Obtener todos los usuarios
export const getAllUsers = async () => {
  const result = await db.select().from(users);
  return result;
};

// Crear un nuevo curso
export const createCourse = async (title: string, description: string, creatorId: string, coverImageKey: string) => {
  // Verificar si el creatorId es un usuario válido
  const userExists = await db.select().from(users).where(eq(users.id, creatorId)).limit(1);

  if (userExists.length === 0) {
    throw new Error("El usuario con el id proporcionado no existe.");
  }

  // Crear el curso si el usuario existe
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
  // Primero eliminar las lecciones asociadas al curso
  await db.delete(lessons).where(eq(lessons.courseId, courseId));

  // Luego eliminar el curso
  await db.delete(courses).where(eq(courses.id, courseId));
};
