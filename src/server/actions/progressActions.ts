'use server';

import {
  getLessonProgress,
  updateLessonProgress,
  completeLessonProgress,
  isLessonUnlocked,
  unlockNextLesson,
} from '~/models/estudiantes/courseModelsStudent';

export async function getLessonProgressAction(
  userId: string,
  lessonId: number
) {
  try {
    const progress = await getLessonProgress(userId, lessonId);
    return { success: true, progress };
  } catch (error) {
    console.error(
      `Error al obtener el progreso de la lección con ID ${lessonId}:`,
      error
    );
    return {
      success: false,
      error: 'No se pudo obtener el progreso de la lección',
    };
  }
}

export async function updateLessonProgressAction(
  userId: string,
  lessonId: number,
  progress: number
) {
  try {
    await updateLessonProgress(userId, lessonId, progress);
    return {
      success: true,
      message: 'Progreso de la lección actualizado exitosamente',
    };
  } catch (error) {
    console.error(
      `Error al actualizar el progreso de la lección con ID ${lessonId}:`,
      error
    );
    return {
      success: false,
      error: 'No se pudo actualizar el progreso de la lección',
    };
  }
}

export async function completeLessonProgressAction(
  userId: string,
  lessonId: number
) {
  try {
    await completeLessonProgress(userId, lessonId);
    return { success: true, message: 'Lección completada exitosamente' };
  } catch (error) {
    console.error(`Error al completar la lección con ID ${lessonId}:`, error);
    return { success: false, error: 'No se pudo completar la lección' };
  }
}

export async function isLessonUnlockedAction(userId: string, lessonId: number) {
  try {
    const isUnlocked = await isLessonUnlocked(userId, lessonId);
    return { success: true, isUnlocked };
  } catch (error) {
    console.error(
      `Error al verificar si la lección con ID ${lessonId} está desbloqueada:`,
      error
    );
    return {
      success: false,
      error: 'No se pudo verificar si la lección está desbloqueada',
    };
  }
}

export async function unlockNextLessonAction(
  userId: string,
  currentLessonId: number
) {
  try {
    await unlockNextLesson(userId, currentLessonId);
    return {
      success: true,
      message: 'Siguiente lección desbloqueada exitosamente',
    };
  } catch (error) {
    console.error(
      `Error al desbloquear la siguiente lección después de la lección con ID ${currentLessonId}:`,
      error
    );
    return {
      success: false,
      error: 'No se pudo desbloquear la siguiente lección',
    };
  }
}
