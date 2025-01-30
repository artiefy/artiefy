import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db/index';
import {
  categories,
  courses,
  lessons,
  modalidades,
  users,
} from '~/server/db/schema';

export interface Lesson {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  coverImageKey: string;
  coverVideoKey: string;
  order: number;
  courseId: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  resourceKey: string;
  _modalidadesId: {
    id: number;
    name: string;
  };
  categoryId: {
    id: number;
    name: string;
  };
}

// Crear una nueva lección
export async function createLesson({
  title,
  description,
  duration,
  coverImageKey,
  coverVideoKey,
  courseId,
  resourceKey,
  resourceNames,
}: {
  title: string;
  description: string;
  duration: number;
  coverImageKey: string;
  coverVideoKey: string;
  courseId: number;
  resourceKey: string;
  resourceNames: string;
}) {
  try {
    // Obtener el valor máximo actual del campo `order` para el curso específico
    const maxOrder = await db
      .select({ maxOrder: sql`MAX(${lessons.order})` })
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .then((rows) => Number(rows[0]?.maxOrder) ?? 0);

    const newOrder = maxOrder + 1;

    const newLesson = await db.insert(lessons).values({
      title,
      description,
      duration,
      coverImageKey,
      coverVideoKey,
      order: newOrder, // Asignar el nuevo valor de `order`
      courseId,
      resourceKey,
      resourceNames,
    });

    console.log('Lección creada:', newLesson);
    return newLesson;
  } catch (error) {
    console.error('Error al crear la lección:', error);
    throw error;
  }
}

// Contar el número de lecciones por curso y dificultad
export const countLessonsByCourseAndDifficulty = async (courseId: number) => {
  const count = await db
    .select({ count: sql`COUNT(${lessons.id})` })
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .then((rows) => Number(rows[0]?.count) ?? 0);

  return count;
};

// Obtener la dificultad del curso
export const getCourseDifficulty = async (courseId: number) => {
  const course = await db
    .select({ dificultad: courses.dificultadid })
    .from(courses)
    .where(eq(courses.id, courseId))
    .then((rows) => rows[0]?.dificultad);

  return course;
};

// Esta función obtiene las lecciones asociadas a un curso por su ID
export async function getLessonsByCourseId(courseId: number) {
  try {
    // Filtra las lecciones por courseId y obtiene datos del curso asociado
    const lessonsData = await db
      .select({
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        lessonDescription: lessons.description,
        lessonDuration: lessons.duration,
        coverImageKey: lessons.coverImageKey,
        coverVideoKey: lessons.coverVideoKey,
        resourceKey: lessons.resourceKey,
        resourceNames: lessons.resourceNames,
        lessonOrder: lessons.order,
        courseId: lessons.courseId,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseInstructor: courses.instructor,
        courseCategories: courses.categoryid,
        courseModalidad: courses.modalidadesid,
        courseDificultad: courses.dificultadid,
      })
      .from(lessons)
      .innerJoin(courses, eq(courses.id, lessons.courseId)) // Hace el JOIN con la tabla courses
      .where(eq(lessons.courseId, courseId)); // Filtra por el courseId

    const lessonsWithCourse = lessonsData.map(
      (Lesson: {
        lessonId: number;
        lessonTitle: string;
        lessonDescription: string | null;
        lessonDuration: number;
        coverImageKey: string;
        coverVideoKey: string;
        resourceKey: string;
        resourceNames: string;
        lessonOrder: number;
        courseId: number;
        courseTitle: string;
        courseDescription: string | null;
        courseInstructor: string;
        courseCategories: number;
        courseModalidad: number;
        courseDificultad: number;
      }) => ({
        id: Lesson.lessonId,
        title: Lesson.lessonTitle,
        coverImageKey: Lesson.coverImageKey,
        coverVideoKey: Lesson.coverVideoKey,
        resourceKey: Lesson.resourceKey,
        resourceNames: Lesson.resourceNames,
        description: Lesson.lessonDescription ?? '',
        createdAt: '', // Este dato puede ser proporcionado si lo tienes
        duration: Lesson.lessonDuration,
        order: Lesson.lessonOrder,
        course: {
          id: Lesson.courseId,
          title: Lesson.courseTitle,
          description: Lesson.courseDescription,
          instructor: Lesson.courseInstructor,
          courseCategories: Lesson.courseCategories,
          categories: Lesson.courseCategories,
          modalidad: Lesson.courseModalidad,
          dificultad: Lesson.courseDificultad,
        },
      })
    );

    return lessonsWithCourse;
  } catch (error) {
    console.error('Error al obtener las lecciones por courseId', error);
    throw error;
  }
}

// Obtener una lección por ID
export const getLessonById = async (
  lessonId: number
): Promise<Lesson | null> => {
  const lessonData = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      description: lessons.description,
      duration: lessons.duration,
      coverImageKey: lessons.coverImageKey,
      coverVideoKey: lessons.coverVideoKey,
      order: lessons.order,
      courseId: lessons.courseId,
      createdAt: lessons.createdAt,
      updatedAt: lessons.updatedAt,
      resourceKey: lessons.resourceKey,
      resourceNames: lessons.resourceNames,
      course: {
        id: courses.id,
        title: courses.title,
        modalidadId: modalidades.name,
        categoryId: categories.name,
        description: courses.description,
        instructor: courses.instructor, // Asegúrate de que el nombre del instructor esté disponible
      },
    })
    .from(lessons)
    .leftJoin(courses, eq(lessons.courseId, courses.id))
    .leftJoin(users, eq(courses.instructor, users.id))
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .where(eq(lessons.id, lessonId))
    .then((rows) => rows[0]);

  return (lessonData as unknown as Lesson) || null;
};

// Actualizar una lección
export const updateLesson = async (
  lessonId: number,
  {
    title,
    description,
    duration,
    coverImageKey,
    coverVideoKey,
    order,
    courseId,
    porcentajecompletado,
    resourceKey,
    resourceNames,
  }: {
    title?: string;
    description?: string;
    duration?: number;
    coverImageKey?: string;
    coverVideoKey?: string;
    order?: number;
    courseId?: number;
    porcentajecompletado?: number;
    resourceKey?: string;
    resourceNames?: string;
  }
): Promise<void> => {
  const updateData: Record<string, unknown> = {};

  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (duration) updateData.duration = duration;
  if (coverImageKey) updateData.coverImageKey = coverImageKey;
  if (coverVideoKey) updateData.coverVideoKey = coverVideoKey;
  if (order) updateData.order = order;
  if (courseId) updateData.courseId = courseId;
  if (porcentajecompletado !== undefined)
    updateData.porcentajecompletado = porcentajecompletado;
  if (resourceKey) updateData.resourceKey = resourceKey;
  if (resourceNames) updateData.resourceNames = resourceNames;

  await db.update(lessons).set(updateData).where(eq(lessons.id, lessonId));
};

// Eliminar una lección
export const deleteLesson = async (lessonId: number): Promise<void> => {
  await db.delete(lessons).where(eq(lessons.id, lessonId));
};

export const deleteLessonsByCourseId = async (courseId: number) => {
  await db.delete(lessons).where(eq(lessons.courseId, courseId));
};
