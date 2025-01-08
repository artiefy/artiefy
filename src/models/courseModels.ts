import { count, eq } from "drizzle-orm";
import { db } from "~/server/db/index";
import {
  categories,
  courses,
  enrollments,
  lessons,
  modalidades,
} from "~/server/db/schema";

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
  categoryid: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  modalidadesid: {
    id: number;
    name: string;
  } | null;
  instructor: string;
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
  coverImageKey,
  modalidadesid,
}: {
  title: string;
  description: string;
  creatorId: string;
  categoryid: number;
  instructor: string;
  coverImageKey?: string;
  modalidadesid: number;
}) {
  try {
    const newCourse = await db.insert(courses).values({
      title,
      description,
      creatorId,
      categoryid,
      instructor,
      coverImageKey,
      modalidadesid,
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
      modalidadesid: {
        id: modalidades.id,
        name: modalidades.name,
      },
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
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
  const courseData = await db
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
      modalidadesid: {
        id: modalidades.id,
        name: modalidades.name,
      },
    })
    .from(courses)
    .where(eq(courses.id, courseId))
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .then((rows) => rows[0]);

  if (!courseData) return null;

  const course = { ...courseData, userId: courseData.creatorId } as Course;

  const lessonsResult = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      description: lessons.description,
      duration: lessons.duration,
      order: lessons.order,
      courseId: lessons.courseId,
      createdAt: lessons.createdAt,
      updatedAt: lessons.updatedAt,
    })
    .from(lessons)
    .where(eq(lessons.courseId, courseId));

  return {
    ...course,
    lessons: lessonsResult,
  };
};

// Obtener todos los cursos
export const getAllCourses = async (): Promise<Course[]> => {
  const result = await db
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
      creatorId: courses.creatorId,
      modalidadesid: {
        id: modalidades.id,
        name: modalidades.name,
      },
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id));

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
    modalidadesid,
    categoryid,
    instructor,
  }: {
    title?: string;
    description?: string;
    coverImageKey?: string;
    modalidadesid?: number;
    categoryid?: number;
    instructor?: string;
  },
): Promise<void> => {
  const updateData: Record<string, unknown> = {};

  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (coverImageKey) updateData.coverImageKey = coverImageKey;
  if (modalidadesid) updateData.modalidadesid = modalidadesid;
  if (categoryid && categoryid > 0) updateData.categoryid = categoryid;
  if (instructor) updateData.instructor = instructor;

  await db.update(courses).set(updateData).where(eq(courses.id, courseId));
};

// Eliminar un curso
export const deleteCourse = async (courseId: number): Promise<void> => {
  // Primero eliminar las lecciones asociadas al curso
  await db.delete(lessons).where(eq(lessons.courseId, courseId));

  // Luego eliminar el curso
  await db.delete(courses).where(eq(courses.id, courseId));
};
