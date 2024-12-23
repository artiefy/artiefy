import { db } from "~/server/db/index";
import { courses, lessons } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export interface Course {
  id: number;
  title: string;
  description: string | null;
  creatorId: string;
  coverImageKey: string | null;
  category: string;
  instructor: string;
  rating: number | null;
  userId: string; // Add this line
}

// Crear un nuevo curso
export const createCourse = async ({
  title,
  description,
  creatorId,
  coverImageKey,
  category,
  instructor,
  rating,
}: {
  title: string;
  description: string;
  creatorId: string;
  coverImageKey: string;
  category: string;
  instructor: string;
  rating: number;
}): Promise<void> => {
  await db.insert(courses).values({
    title,
    description,
    creatorId,
    coverImageKey,
    category,
    instructor,
    rating,
  });
};

// Obtener todos los cursos
export const getAllCourses = async (): Promise<Course[]> => {
  const result = await db.select().from(courses);
  return result.map(course => ({
    ...course,
    userId: course.creatorId // Assuming userId is the same as creatorId
  }));
};

// Obtener un curso por ID
export const getCourseById = async (courseId: number): Promise<Course | null> => {
  const result = await db.select().from(courses).where(eq(courses.id, courseId));
  return result.length > 0 && result[0] ? { ...result[0], userId: result[0].creatorId } : null;
};

// Actualizar un curso
export const updateCourse = async (
  courseId: number,
  {
    title,
    description,
    coverImageKey,
    category,
    instructor,
    rating,
  }: {
    title: string;
    description: string;
    coverImageKey: string;
    category: string;
    instructor: string;
    rating: number;
  }
): Promise<void> => {
  await db
    .update(courses)
    .set({ title, description, coverImageKey, category, instructor, rating })
    .where(eq(courses.id, courseId));
};

// Eliminar un curso
export const deleteCourse = async (courseId: number): Promise<void> => {
  // Primero eliminar las lecciones asociadas al curso
  await db.delete(lessons).where(eq(lessons.courseId, courseId));

  // Luego eliminar el curso
  await db.delete(courses).where(eq(courses.id, courseId));
};

