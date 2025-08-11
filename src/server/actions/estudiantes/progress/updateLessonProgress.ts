"use server";

import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import {
  activities,
  lessons,
  userActivitiesProgress,
  userLessonsProgress,
} from "~/server/db/schema";
import { sortLessons } from "~/utils/lessonSorting";

const unlockNextLesson = async (lessonId: number, userId: string) => {
  // Obtener información de la lección actual
  const currentLesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
  });

  if (!currentLesson) return;

  // Obtener todas las lecciones del curso
  const courseLessons = await db.query.lessons.findMany({
    where: eq(lessons.courseId, currentLesson.courseId),
  });

  // Ordenar las lecciones usando sortLessons
  const sortedLessons = sortLessons(courseLessons);

  // Encontrar la siguiente lección en el orden correcto
  const currentIndex = sortedLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = sortedLessons[currentIndex + 1];

  if (!nextLesson) return;

  // Verificar si hay actividades en la lección actual
  const lessonActivities = await db.query.activities.findMany({
    where: eq(activities.lessonsId, lessonId),
  });

  if (lessonActivities.length === 0) {
    // Si no hay actividades, desbloquear automáticamente la siguiente lección
    await db
      .update(userLessonsProgress)
      .set({ isLocked: false })
      .where(
        and(
          eq(userLessonsProgress.userId, userId),
          eq(userLessonsProgress.lessonId, nextLesson.id),
        ),
      );
  }
};

// Función auxiliar para verificar si todas las actividades de una lección están completadas
const areAllActivitiesCompleted = async (
  lessonId: number,
  userId: string,
): Promise<boolean> => {
  // Obtener todas las actividades de la lección
  const lessonActivities = await db.query.activities.findMany({
    where: eq(activities.lessonsId, lessonId),
  });

  if (lessonActivities.length === 0) {
    return true; // Si no hay actividades, se considera completado
  }

  // Obtener progreso de actividades del usuario
  // Fix: Use activityId instead of lessonId in the where condition
  const activitiesProgress = await db.query.userActivitiesProgress.findMany({
    where: and(
      eq(userActivitiesProgress.userId, userId),
      // This is the corrected line - we need to check activities that belong to the lesson
      eq(activities.lessonsId, lessonId),
    ),
  });

  // Verificar si todas las actividades tienen progreso y están completadas
  return (
    activitiesProgress.length === lessonActivities.length &&
    activitiesProgress.every((progress) => progress.isCompleted)
  );
};

export async function updateLessonProgress(
  lessonId: number,
  progress: number,
): Promise<void> {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error("Usuario no autenticado");
  }

  const userId = user.id;

  // Obtener información de la lección actual para saber si tiene video
  const currentLesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
  });

  if (!currentLesson) {
    throw new Error("Lección no encontrada");
  }

  // Determinar si la lección tiene video
  const hasVideo =
    currentLesson.coverVideoKey !== "none" &&
    currentLesson.coverVideoKey !== null &&
    currentLesson.coverVideoKey !== "";

  // Obtener actividades de la lección
  const lessonActivities = await db.query.activities.findMany({
    where: eq(activities.lessonsId, lessonId),
  });

  const hasActivities = lessonActivities.length > 0;

  // Verificar si todas las actividades están completadas (si hay)
  const allActivitiesCompleted = await areAllActivitiesCompleted(
    lessonId,
    userId,
  );

  // Determinar si la lección está completada según las reglas:
  // 1. Si tiene video y actividades: solo se completa cuando todas las actividades están completadas
  // 2. Si tiene video pero no actividades: se completa cuando el video se ve al 100%
  // 3. Si no tiene video: se completa cuando todas las actividades están completadas
  let isCompleted = false;

  if (!hasVideo && hasActivities) {
    // Caso: No hay video, solo actividades
    isCompleted = allActivitiesCompleted;
  } else if (hasVideo && !hasActivities) {
    // Caso: Solo video, sin actividades
    isCompleted = progress >= 100;
  } else if (hasVideo && hasActivities) {
    // Caso: Video y actividades
    isCompleted = allActivitiesCompleted;
  } else {
    // Caso extremo: ni video ni actividades
    isCompleted = progress >= 100;
  }

  // Actualizar el progreso de la lección
  await db
    .insert(userLessonsProgress)
    .values({
      userId,
      lessonId,
      progress: isCompleted ? 100 : progress, // Si está completada, forzar 100%
      isCompleted,
      isLocked: false,
      isNew: progress >= 1 ? false : true,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
      set: {
        progress: isCompleted ? 100 : progress, // Si está completada, forzar 100%
        isCompleted,
        isLocked: false,
        isNew: progress >= 1 ? false : true,
        lastUpdated: new Date(),
      },
    });

  await db
    .update(userLessonsProgress)
    .set({ isLocked: progress === 0 })
    .where(
      and(
        eq(userLessonsProgress.userId, userId),
        eq(userLessonsProgress.lessonId, lessonId),
      ),
    );

  // Solo desbloquear la siguiente lección si esta lección está completada
  if (isCompleted) {
    await unlockNextLesson(lessonId, user.id);
  }
}
