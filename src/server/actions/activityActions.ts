'use server';

import {
  getActivitiesByLessonId,
  getActivityCompletion,
  completeActivity,
} from '~/models/estudiantes/courseModelsStudent';

export async function getActivitiesByLessonIdAction(lessonId: number) {
  try {
    const activities = await getActivitiesByLessonId(lessonId);
    return { success: true, activities };
  } catch (error) {
    console.error(
      `Error al obtener las actividades de la lección con ID ${lessonId}:`,
      error
    );
    return {
      success: false,
      error: 'No se pudieron obtener las actividades de la lección',
    };
  }
}

export async function getActivityCompletionAction(activityId: number) {
  try {
    const completed = await getActivityCompletion(activityId);
    return { success: true, completed };
  } catch (error) {
    console.error(
      `Error al obtener el estado de completado de la actividad con ID ${activityId}:`,
      error
    );
    return {
      success: false,
      error: 'No se pudo obtener el estado de completado de la actividad',
    };
  }
}

export async function completeActivityAction(activityId: number) {
  try {
    await completeActivity(activityId);
    return { success: true, message: 'Actividad completada exitosamente' };
  } catch (error) {
    console.error(
      `Error al completar la actividad con ID ${activityId}:`,
      error
    );
    return { success: false, error: 'No se pudo completar la actividad' };
  }
}
