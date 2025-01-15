'use server';

import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '~/models/estudiantes/courseModelsStudent';

export async function getAllCoursesAction() {
  try {
    const courses = await getAllCourses();
    return { success: true, courses };
  } catch (error) {
    console.error('Error al obtener todos los cursos:', error);
    return { success: false, error: 'No se pudieron obtener los cursos' };
  }
}

export async function getCourseByIdAction(courseId: number) {
  try {
    const course = await getCourseById(courseId);
    return { success: true, course };
  } catch (error) {
    console.error(`Error al obtener el curso con ID ${courseId}:`, error);
    return { success: false, error: 'No se pudo obtener el curso' };
  }
}

export async function createCourseAction(courseData: {
  title: string;
  description: string;
  creatorId: string;
  coverImageKey: string;
  categoryid: number;
  instructor: string;
  rating: number;
  modalidadesid: number;
  dificultadid: number;
}) {
  try {
    await createCourse(courseData);
    return { success: true, message: 'Curso creado exitosamente' };
  } catch (error) {
    console.error('Error al crear el curso:', error);
    return { success: false, error: 'No se pudo crear el curso' };
  }
}

export async function updateCourseAction(
  courseId: number,
  courseData: {
    title: string;
    description: string;
    coverImageKey: string;
    categoryid: number;
    instructor: string;
    rating: number;
    modalidadesid: number;
  }
) {
  try {
    await updateCourse(courseId, courseData);
    return { success: true, message: 'Curso actualizado exitosamente' };
  } catch (error) {
    console.error(`Error al actualizar el curso con ID ${courseId}:`, error);
    return { success: false, error: 'No se pudo actualizar el curso' };
  }
}

export async function deleteCourseAction(courseId: number) {
  try {
    await deleteCourse(courseId);
    return { success: true, message: 'Curso eliminado exitosamente' };
  } catch (error) {
    console.error(`Error al eliminar el curso con ID ${courseId}:`, error);
    return { success: false, error: 'No se pudo eliminar el curso' };
  }
}
