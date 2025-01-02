import { count, eq } from "drizzle-orm";
import { db } from "~/server/db/index";
import { categories, courses, enrollments, lessons } from "~/server/db/schema";

export interface Lesson {
  id: number;
  title: string;
  duration: number; // Duración de la lección en horas
  description: string | null;
  order: number;
  courseId: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  creatorId: string;
  coverImageKey: string | null;
  categoryid: number;
  instructor: string;
  rating: number | null;
  userId: string;
  lessons?: Lesson[];
  totalStudents?: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

// Crear un nuevo curso
export async function createCourse({
  title,
  description,
  creatorId,
  categoryid,
  instructor,
  rating,
  coverImageKey,
}: {
  title: string;
  description: string;
  creatorId: string;
  categoryid: number;
  instructor: string;
  rating: number;
  coverImageKey?: string;
}) {
  try {
    const newCourse = await db.insert(courses).values({
      title,
      description,
      creatorId,
      categoryid,
      instructor,
      rating,
      coverImageKey,
    });

    console.log("Curso creado:", newCourse);
    return newCourse;
  } catch (error) {
    console.error("Error al crear el curso:", error);
    throw error;
  }
}

// Obtener todos los cursos de un profesor
export const getCoursesByUserId = async (userId: string) => {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      coverImageKey: courses.coverImageKey,
      categoryid: {
        id: categories.id,
        name: categories.name,
        description: categories.description,
      },
      instructor: courses.instructor,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      creatorId: courses.creatorId,
      rating: courses.rating,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .where(eq(courses.creatorId, userId));
};

// Obtener el número total de estudiantes inscritos en un curso
export const getTotalStudents = async (courseId: number): Promise<number> => {
  const result = await db
    .select({ totalStudents: count() })
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId));
  return result[0]?.totalStudents ?? 0;
};

// Obtener un curso por ID
export const getCourseById = async (
  courseId: number,
): Promise<Course | null> => {
  const courseResult = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));
  if (courseResult.length === 0) return null;

  const courseData = courseResult[0];
  if (!courseData) return null;
  const course = { ...courseData, userId: courseData.creatorId } as Course;

  const lessonsResult = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.order);
  course.lessons = lessonsResult.map((lesson) => ({
    ...lesson,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  }));

  // Obtener el número total de estudiantes inscritos
  course.totalStudents = await getTotalStudents(courseId);

  return course;
};

// Obtener todos los cursos
export const getAllCourses = async (): Promise<Course[]> => {
  const result = await db.select().from(courses);
  return result.map((course) => ({
    ...course,
    userId: course.creatorId,
  }));
};

// Actualizar un curso
export const updateCourse = async (
  courseId: number,
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
  },
): Promise<void> => {
  await db
    .update(courses)
    .set({
      title,
      description,
      coverImageKey,

      categoryid,
      instructor,
      rating,
    })
    .where(eq(courses.id, courseId));
};

// Eliminar un curso
export const deleteCourse = async (courseId: number): Promise<void> => {
  // Primero eliminar las lecciones asociadas al curso
  await db.delete(lessons).where(eq(lessons.courseId, courseId));

  // Luego eliminar el curso
  await db.delete(courses).where(eq(courses.id, courseId));
};
