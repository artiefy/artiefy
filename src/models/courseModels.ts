import { db } from "~/server/db/index";
import { courses, lessons } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export interface Lesson {
  id: number;
  title: string;
  duration: number; // Duración de la lección en horas
  description: string | null;
  order: number;
  courseId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  creatorId: string;
  coverImageKey: string | null;
  category: string;
  instructor: string;
  rating: number | null;
  userId: string;
  lessons?: Lesson[];
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
    userId: course.creatorId 
  }));
};

// Obtener un curso por ID
export const getCourseById = async (courseId: number): Promise<Course | null> => {
  const courseResult = await db.select().from(courses).where(eq(courses.id, courseId));
  if (courseResult.length === 0) return null;

  const courseData = courseResult[0];
  if (!courseData) return null;
  const course = { ...courseData, userId: courseData.creatorId } as Course;

  const lessonsResult = await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(lessons.order);
  course.lessons = lessonsResult.map(lesson => ({
    ...lesson,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  }));


  return course;
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