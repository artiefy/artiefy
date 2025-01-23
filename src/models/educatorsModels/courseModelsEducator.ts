import { eq, count } from 'drizzle-orm';
import { db } from '~/server/db/index';
import {
  courses,
  users,
  categories,
  modalidades,
  enrollments,
  dificultad,
} from '~/server/db/schema';

// Obtener el número total de cursos en la plataforma
export const getTotalCourses = async (): Promise<number> => {
  const result = await db.select({ totalCourses: count() }).from(courses);
  return result[0]?.totalCourses ?? 0;
};
export interface Lesson {
  id: number;
  title: string;
  duration: number;
  description: string | null;
  order: number;
  courseId: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}
export interface dificultad {
  id: number;
  name: string;
  description: string | null;
}

export interface Modalidad {
  id: number;
  name: string;
  description: string | null;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  coverImageKey: string;
  categoryid: number;
  modalidadesid: number;
  dificultadid: number;
  instructor: string;
  creatorId: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

// Crear un nuevo curso
export const createCourse = async ({
  title,
  description,
  coverImageKey,
  categoryid,
  modalidadesid,
  dificultadid,
  instructor,
  creatorId,
}: {
  title: string;
  description: string;
  coverImageKey: string;
  categoryid: number;
  modalidadesid: number;
  dificultadid: number;
  instructor: string;
  creatorId: string;
}) => {
  return db.insert(courses).values({
    title,
    description,
    coverImageKey,
    categoryid,
    modalidadesid,
    dificultadid,
    instructor,
    creatorId,
  });
};

// Obtener todos los cursos de un profesor
export const getCoursesByUserId = async (userId: string) => {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      coverImageKey: courses.coverImageKey,
      categoryid: categories.name,
      modalidadesid: modalidades.name,
      dificultadid: dificultad.name,
      instructor: courses.instructor,
      creatorId: courses.creatorId,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(users, eq(courses.instructor, users.id))
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .leftJoin(dificultad, eq(courses.dificultadid, dificultad.id))
    .where(eq(courses.creatorId, userId));
};

// Obtener el número total de estudiantes inscritos en un curso
export const getTotalStudents = async (course_id: number): Promise<number> => {
  const result = await db
    .select({ totalStudents: count() })
    .from(enrollments)
    .where(eq(enrollments.courseId, course_id));
  return result[0]?.totalStudents ?? 0;
};

// Obtener un curso por ID
export const getCourseById = async (courseId: number) => {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      coverImageKey: courses.coverImageKey,
      categoryid: categories.name,
      modalidadesid: modalidades.name,
      dificultadid: dificultad.name,
      instructor: courses.instructor,
      creatorId: courses.creatorId,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .leftJoin(dificultad, eq(courses.dificultadid, dificultad.id)) // Agregar esta línea
    .where(eq(courses.id, courseId))
    .then((rows) => rows[0]);
};

// Obtener todos los cursos
export const getAllCourses = async () => {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      coverImageKey: courses.coverImageKey,
      categoryid: categories.name,
      modalidadesid: modalidades.name,
      dificultadid: dificultad.name,
      instructor: courses.instructor,
      creatorId: courses.creatorId,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(dificultad, eq(courses.dificultadid, dificultad.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id));
};

// Actualizar un curso
export const updateCourse = async (
  courseId: number,
  {
    title,
    description,
    coverImageKey,
    categoryid,
    modalidadesid,
    dificultadid,
    instructor,
  }: {
    title: string;
    description: string;
    coverImageKey: string;
    categoryid: number;
    modalidadesid: number;
    dificultadid: number;
    instructor: string;
  }
) => {
  return db
    .update(courses)
    .set({
      title,
      description,
      coverImageKey,
      categoryid,
      modalidadesid,
      dificultadid,
      instructor,
    })
    .where(eq(courses.id, courseId));
};

// Eliminar un curso
export const deleteCourse = async (courseId: number) => {
  return db.delete(courses).where(eq(courses.id, courseId));
};
