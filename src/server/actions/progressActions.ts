// 'use server';

// import {
//   getLessonProgress,
//   updateLessonProgress,
//   completeLessonProgress,
//   isLessonUnlocked,
//   unlockNextLesson,
// } from '~/models/estudiantes/courseModelsStudent';

// export async function getLessonProgressAction(lessonId: number) {
//   try {
//     const progress = await getLessonProgress(lessonId);
//     return { success: true, progress };
//   } catch (error) {
//     console.error(
//       `Error al obtener el progreso de la lección con ID ${lessonId}:`,
//       error
//     );
//     return {
//       success: false,
//       error: 'No se pudo obtener el progreso de la lección',
//     };
//   }
// }

// export async function updateLessonProgressAction(
//   lessonId: number,
//   progress: number
// ) {
//   try {
//     await updateLessonProgress(lessonId, progress);
//     return {
//       success: true,
//       message: 'Progreso de la lección actualizado exitosamente',
//     };
//   } catch (error) {
//     console.error(
//       `Error al actualizar el progreso de la lección con ID ${lessonId}:`,
//       error
//     );
//     return {
//       success: false,
//       error: 'No se pudo actualizar el progreso de la lección',
//     };
//   }
// }

// export async function completeLessonProgressAction(lessonId: number) {
//   try {
//     await completeLessonProgress(lessonId);
//     return { success: true, message: 'Lección completada exitosamente' };
//   } catch (error) {
//     console.error(`Error al completar la lección con ID ${lessonId}:`, error);
//     return { success: false, error: 'No se pudo completar la lección' };
//   }
// }

// export async function isLessonUnlockedAction(lessonId: number) {
//   try {
//     const isUnlocked = await isLessonUnlocked(lessonId);
//     return { success: true, isUnlocked };
//   } catch (error) {
//     console.error(
//       `Error al verificar si la lección con ID ${lessonId} está desbloqueada:`,
//       error
//     );
//     return {
//       success: false,
//       error: 'No se pudo verificar si la lección está desbloqueada',
//     };
//   }
// }

// export async function unlockNextLessonAction(currentLessonId: number) {
//   try {
//     await unlockNextLesson(currentLessonId);
//     return {
//       success: true,
//       message: 'Siguiente lección desbloqueada exitosamente',
//     };
//   } catch (error) {
//     console.error(
//       `Error al desbloquear la siguiente lección después de la lección con ID ${currentLessonId}:`,
//       error
//     );
//     return {
//       success: false,
//       error: 'No se pudo desbloquear la siguiente lección',
//     };
//   }
// }
