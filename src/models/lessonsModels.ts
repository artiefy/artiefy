import { eq } from "drizzle-orm";
import { db } from "~/server/db/index";
import { lessons } from "~/server/db/schema";

// Interfaces
export interface Lesson {
  id: number;
  title: string;
  duration: number;
  description: string | null;
  imageKey: string | null;
  videoKey: string | null;
  order: number;
  courseId: number;
  createdAt: Date;
  updatedAt: Date;
  porcentajeCompletado: number | null;
}

// Validaciones
const validateLesson = (lesson: Partial<Lesson>) => {
  if (!lesson.title || lesson.title.length === 0) {
    throw new Error("El título de la lección es requerido");
  }
  if (!lesson.duration || lesson.duration <= 0) {
    throw new Error("La duración debe ser mayor a 0");
  }
  if (!lesson.order || lesson.order < 0) {
    throw new Error("El orden debe ser un número positivo");
  }
  if (!lesson.courseId) {
    throw new Error("El ID del curso es requerido");
  }
};

// CRUD Operations

// Crear una nueva lección
export const createLesson = async ({
  title,
  duration,
  description,
  imageKey,
  videoKey,
  order,
  courseId,
}: Omit<
  Lesson,
  "id" | "createdAt" | "updatedAt" | "porcentajeCompletado"
>): Promise<void> => {
  try {
    validateLesson({ title, duration, description, order, courseId });
    await db.insert(lessons).values({
      title,
      duration,
      description,
      imageKey,
      videoKey,
      order,
      courseId,
      porcentajeCompletado: 0,
    });
  } catch (error) {
    throw new Error(
      `Error al crear la lección: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};

// Obtener una lección por ID
export const getLessonById = async (
  lessonId: number,
): Promise<Lesson | null> => {
  try {
    const result = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    return result[0] ?? null;
  } catch (error) {
    throw new Error(
      `Error al obtener la lección: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};

// Obtener todas las lecciones de un curso
export const getLessonsByCourseId = async (
  courseId: number,
): Promise<Lesson[]> => {
  try {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.order);
  } catch (error) {
    throw new Error(
      `Error al obtener las lecciones del curso: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};

// Actualizar una lección
export const updateLesson = async (
  lessonId: number,
  {
    title,
    duration,
    description,
    imageKey,
    videoKey,
    order,
    porcentajeCompletado,
  }: Partial<Omit<Lesson, "id" | "courseId" | "createdAt" | "updatedAt">>,
): Promise<void> => {
  try {
    const updateData: Partial<Lesson> = {};

    if (title !== undefined) updateData.title = title;
    if (duration !== undefined) updateData.duration = duration;
    if (description !== undefined) updateData.description = description;
    if (imageKey !== undefined) updateData.imageKey = imageKey;
    if (videoKey !== undefined) updateData.videoKey = videoKey;
    if (order !== undefined) updateData.order = order;
    if (porcentajeCompletado !== undefined)
      updateData.porcentajeCompletado = porcentajeCompletado;

    validateLesson(updateData);

    await db.update(lessons).set(updateData).where(eq(lessons.id, lessonId));
  } catch (error) {
    throw new Error(
      `Error al actualizar la lección: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};

// Eliminar una lección
export const deleteLesson = async (lessonId: number): Promise<void> => {
  try {
    await db.delete(lessons).where(eq(lessons.id, lessonId));
  } catch (error) {
    throw new Error(
      `Error al eliminar la lección: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};

// Actualizar el porcentaje completado de una lección
export const updateLessonProgress = async (
  lessonId: number,
  porcentajeCompletado: number,
): Promise<void> => {
  try {
    if (porcentajeCompletado < 0 || porcentajeCompletado > 100) {
      throw new Error("El porcentaje completado debe estar entre 0 y 100");
    }

    await db
      .update(lessons)
      .set({ porcentajeCompletado })
      .where(eq(lessons.id, lessonId));
  } catch (error) {
    throw new Error(
      `Error al actualizar el progreso de la lección: ${error instanceof Error ? error.message : "Error desconocido"}`,
    );
  }
};
