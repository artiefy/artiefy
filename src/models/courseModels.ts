import { db } from "~/server/db/index";
import { users, courses, lessons } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Tipos
interface User {
  id: number
  email: string
  name: string | null
  role: string
  createdAt: Date
  updatedAt: Date
}

interface Course {
  id: number
  title: string
  description: string | null
  coverImageKey: string | null
  creatorId: number
}

// Obtener un usuario por ID
export const getUserById = async (id: number): Promise<User | null> => {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] ?? null : null;
};

// Obtener todos los usuarios
export const getAllUsers = async (): Promise<User[]> => {
  const result = await db.select().from(users);
  return result;
};

// Crear un nuevo usuario
export const createUser = async (id: number, email: string, name: string): Promise<void> => {
  await db.insert(users).values({
    id,
    email,
    name,
  });
};

// Crear un nuevo curso
export const createCourse = async (title: string, description: string, creatorId: number, coverImageKey: string): Promise<void> => {
  await db.insert(courses).values({
    title,
    description,
    creatorId,
    coverImageKey,
  });
};

// Obtener todos los cursos
export const getAllCourses = async (): Promise<Course[]> => {
  const result = await db.select().from(courses);
  return result;
};

// Obtener un curso por ID
export const getCourseById = async (courseId: number): Promise<Course | null> => {
  const result = await db.select().from(courses).where(eq(courses.id, courseId));
  return result.length > 0 ? result[0] ?? null : null;
};

// Actualizar un curso
export const updateCourse = async (courseId: number, title: string, description: string, coverImageKey: string): Promise<void> => {
  await db.update(courses).set({ title, description, coverImageKey }).where(eq(courses.id, courseId));
};

// Eliminar un curso
export const deleteCourse = async (courseId: number): Promise<void> => {
  // Primero eliminar las lecciones asociadas al curso
  await db.delete(lessons).where(eq(lessons.courseId, courseId));

  // Luego eliminar el curso
  await db.delete(courses).where(eq(courses.id, courseId));
};