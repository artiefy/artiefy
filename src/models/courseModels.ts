import { db } from "~/server/db/index";
import { courses, lessons, enrollments, categories } from "~/server/db/schema";
import { eq, count } from "drizzle-orm";

export interface Lesson {
  id: number;
  title: string;
  duration: number; // Duración de la lección en horas
  description: string | null;
  order: number;
  course_id: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  creatorId: string;
  coverImageKey: string | null;
  categoryid: number;
  category: Category;
  instructor: string;
  rating: number | null;
  userId: string;
  lessons?: Lesson[];
  totalStudents?: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

// Crear un nuevo curso
export const createCourse = async ({
  title,
  description,
  creatorId,
  coverImageKey,
  categoryid,
  instructor,
  rating,
}: {
  title: string;
  description: string;
  creatorId: string;
  coverImageKey: string;
  categoryid: number;
  instructor: string;
  rating: number;
}): Promise<void> => {
  await db.insert(courses).values({
    title,
    description,
    creatorId,
    coverImageKey,
    categoryid,
    instructor,
    rating,
  });
};

// Obtener todos los cursos de un profesor
export const getCoursesByUserId = async (userId: string): Promise<Course[]> => {
  const result = await db.select().from(courses).where(eq(courses.creatorId, userId));
  const categoriesResult = await db.select().from(categories);
  const categoriesMap = new Map(categoriesResult.map(category => [category.id, category]));

  return result.map(course => ({
    ...course,
    userId: course.creatorId,
    category: categoriesMap.get(course.categoryid) ?? { id: course.categoryid, name: '', description: null }
  }));
};

// Obtener el número total de estudiantes inscritos en un curso
export const getTotalStudents = async (course_id: number): Promise<number> => {
  const result = await db
    .select({ totalStudents: count() })
    .from(enrollments)
    .where(eq(enrollments.course_id, course_id));
  return result[0]?.totalStudents ?? 0;
};

// Obtener un curso por ID
export const getCourseById = async (course_id: number): Promise<Course | null> => {
  const courseResult = await db.select().from(courses).where(eq(courses.id, course_id));
  if (courseResult.length === 0) return null;

  const courseData = courseResult[0];
  if (!courseData) return null;
  const course = { ...courseData, userId: courseData.creatorId } as Course;

  const categoryResult = await db.select().from(categories).where(eq(categories.id, course.categoryid));
  if (categoryResult.length > 0 && categoryResult[0]) {
    course.category = categoryResult[0];
  } else {
    course.category = { id: course.categoryid, name: '', description: null };
  }

  const lessonsResult = await db.select().from(lessons).where(eq(lessons.course_id, course_id)).orderBy(lessons.order);
  course.lessons = lessonsResult.map(lesson => ({
    ...lesson,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  }));

  // Obtener el número total de estudiantes inscritos
  course.totalStudents = await getTotalStudents(course_id);

  return course;
};

// Obtener todos los cursos
export const getAllCourses = async (): Promise<Course[]> => {
  const result = await db.select().from(courses);
  const categoriesResult = await db.select().from(categories);
  const categoriesMap = new Map(categoriesResult.map(category => [category.id, category]));

  return result.map(course => ({
    ...course,
    userId: course.creatorId,
    category: categoriesMap.get(course.categoryid) ?? { id: course.categoryid, name: '', description: null }
  }));
};

// Actualizar un curso
export const updateCourse = async (
  course_id: number,
  {
    title,
    description,
    coverImageKey,
    categoryid,
    instructor,
    rating,
  }: {
    title: string;
    description: string;
    coverImageKey: string;
    categoryid: number;
    instructor: string;
    rating: number;
  }
): Promise<void> => {
  await db
    .update(courses)
    .set({ title, description, coverImageKey, categoryid, instructor, rating })
    .where(eq(courses.id, course_id));
};

// Eliminar un curso
export const deleteCourse = async (course_id: number): Promise<void> => {
  // Primero eliminar las lecciones asociadas al curso
  await db.delete(lessons).where(eq(lessons.course_id, course_id));

  // Luego eliminar el curso
  await db.delete(courses).where(eq(courses.id, course_id));
};