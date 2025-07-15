import { and, count, eq, isNotNull, ne as neq, sum } from 'drizzle-orm';

import { db } from '~/server/db/index';
import {
  categories,
  courseCourseTypes,
  courses,
  courseTypes,
  enrollments,
  lessons,
  materias,
  modalidades,
  nivel,
  users,
} from '~/server/db/schema';

import { deleteForumByCourseId } from './forumAndPosts'; // Importar la función para eliminar foros
import { deleteLessonsByCourseId } from './lessonsModels'; // Importar la función para eliminar lecciones
import { deleteParametroByCourseId } from './parametrosModels'; // Importar la función para eliminar parámetros

export interface Lesson {
  id: number;
  title: string;
  duration: number;
  description: string | null;
  courseId: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}
export interface Nivel {
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
  categoryid: number | null;
  modalidadesid: number | null;
  nivelid: number | null;
  rating: number;
  instructor: string; // Changed from instructorId
  creatorId: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

interface CreateCourseData {
  title: string;
  description: string;
  coverImageKey: string;
  coverVideoCourseKey?: string;
  categoryid: number;
  modalidadesid: number;
  nivelid: number;
  instructor: string;
  creatorId: string;
  courseTypeId?: number | null;
  individualPrice?: number | null; // <-- AGREGADO
}

interface ApiError {
  message: string;
  code?: string;
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string'
  );
}

export async function createCourse(data: CreateCourseData) {
  try {
    if (!data.instructor) {
      throw new Error('Instructor ID is required');
    }

    // 👇 le damos tipo explícito
    const normalizedTypes: number[] = Array.isArray(data.courseTypeId)
      ? data.courseTypeId
      : [];

    let finalCourseTypeId: number | null = null;
    let finalPrice: number | null = null;

    if (normalizedTypes.length === 1) {
      finalCourseTypeId = normalizedTypes[0];
      if (finalCourseTypeId === 4) {
        finalPrice = data.individualPrice ?? 0;
      }
    } else if (normalizedTypes.length > 1) {
      finalCourseTypeId = null; // Para tabla intermedia
      if (normalizedTypes.includes(4)) {
        finalPrice = data.individualPrice ?? 0;
      }
    }

    if (normalizedTypes.includes(4) && finalPrice !== null && finalPrice < 0) {
      throw new Error(
        'Individual price must be a non-negative number for course type 4'
      );
    }

    const createdCourse = await db
      .insert(courses)
      .values({
        title: data.title,
        description: data.description,
        coverImageKey: data.coverImageKey,
        coverVideoCourseKey: data.coverVideoCourseKey,
        categoryid: data.categoryid,
        modalidadesid: data.modalidadesid,
        nivelid: data.nivelid,
        instructor: data.instructor,
        creatorId: data.creatorId,
        courseTypeId: finalCourseTypeId,
        individualPrice: normalizedTypes.includes(4) ? finalPrice : null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .then((res) => res[0]);

    console.log('✅ Curso creado:', createdCourse);

    // Si hay múltiples tipos, insertamos en tabla intermedia
    if (normalizedTypes.length > 1 && createdCourse?.id) {
      for (const typeId of normalizedTypes) {
        await db.insert(courseCourseTypes).values({
          courseId: createdCourse.id,
          courseTypeId: typeId,
        });
        console.log(`➡ Asociado tipo ${typeId} al curso ${createdCourse.id}`);
      }
    }

    return createdCourse;
  } catch (error) {
    console.error('❌ Database error creating course:', error);
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
      categoryid: categories.name,
      modalidadesid: modalidades.name,
      nivelid: nivel.name,
      instructor: courses.instructor, // Keep using instructor for now
      rating: courses.rating,
      creatorId: courses.creatorId,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .leftJoin(nivel, eq(courses.nivelid, nivel.id))
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

// Obtener todas las lecciones de un curso
export const getLessonsByCourseId = async (courseId: number) => {
  return db
    .select({
      id: lessons.id,
      title: lessons.title,
      duration: lessons.duration,
      description: lessons.description,
      courseId: lessons.courseId,
      createdAt: lessons.createdAt,
      updatedAt: lessons.updatedAt,
    })
    .from(lessons)
    .where(eq(lessons.courseId, courseId));
};

//obtener duracion total de todas las clases por courseId
export const getTotalDuration = async (courseId: number) => {
  const result = await db
    .select({ totalDuration: sum(lessons.duration) })
    .from(lessons)
    .where(eq(lessons.courseId, courseId));
  return result[0]?.totalDuration ?? 0;
};

// Obtener un curso por ID
export const getCourseById = async (courseId: number) => {
  try {
    const course = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        coverImageKey: courses.coverImageKey,
        categoryid: courses.categoryid,
        modalidadesid: courses.modalidadesid,
        nivelid: courses.nivelid,
        rating: courses.rating,
        instructor: courses.instructor,
        creatorId: courses.creatorId,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        courseTypeId: courses.courseTypeId,
        isActive: courses.isActive,
        individualPrice: courses.individualPrice,
        instructorName: users.name,
        instructorEmail: users.email,
        coverVideoCourseKey: courses.coverVideoCourseKey,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructor, users.id))
      .where(eq(courses.id, courseId))
      .then((rows) => rows[0]);

    if (!course) {
      console.error(`❌ Curso con ID ${courseId} no encontrado.`);
      return null;
    }

    // Obtener los nombres adicionales
    const category = course.categoryid
      ? await db
          .select({ name: categories.name })
          .from(categories)
          .where(eq(categories.id, course.categoryid))
          .then((rows) => rows[0]?.name ?? null)
      : null;

    const modalidad = course.modalidadesid
      ? await db
          .select({ name: modalidades.name })
          .from(modalidades)
          .where(eq(modalidades.id, course.modalidadesid))
          .then((rows) => rows[0]?.name ?? null)
      : null;

    const nivelName = course.nivelid
      ? await db
          .select({ name: nivel.name })
          .from(nivel)
          .where(eq(nivel.id, course.nivelid))
          .then((rows) => rows[0]?.name ?? null)
      : null;

    const courseTypeName = course.courseTypeId
      ? await db
          .select({ name: courseTypes.name })
          .from(courseTypes)
          .where(eq(courseTypes.id, course.courseTypeId))
          .then((rows) => rows[0]?.name ?? null)
      : null;

    const totalStudents = await getTotalStudents(courseId);

    return {
      ...course,
      instructor: course.instructorName ?? 'Sin nombre',
      instructorEmail: course.instructorEmail ?? 'No disponible',
      categoryName: category,
      modalidadName: modalidad,
      nivelName,
      courseTypeName,
      totalStudents,
    };
  } catch (err: unknown) {
    console.error(
      `❌ Error al obtener el curso con ID ${courseId}:`,
      err instanceof Error ? err.message : 'Error desconocido'
    );
    return null;
  }
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
      nivelid: nivel.name,
      instructor: courses.instructor, // Changed from instructorId
      creatorId: courses.creatorId,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      isActive: courses.isActive,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(nivel, eq(courses.nivelid, nivel.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id));
};

// Actualizar un curso
export const updateCourse = async (
  courseId: number,
  updateData: {
    title?: string;
    description?: string;
    coverImageKey?: string;
    categoryid?: number;
    modalidadesid?: number;
    nivelid?: number;
    instructor?: string;
    rating?: number;
    isActive?: boolean;
    coverVideoCourseKey?: string;
    individualPrice?: number | null;
    courseTypeId?: number[];
  }
) => {
  try {
    // 🔄 Sincroniza courseTypeId en tabla intermedia si existe
    if (Array.isArray(updateData.courseTypeId)) {
      // Borra relaciones anteriores
      await db
        .delete(courseCourseTypes)
        .where(eq(courseCourseTypes.courseId, courseId));

      // Inserta nuevas relaciones
      await db.insert(courseCourseTypes).values(
        updateData.courseTypeId.map((typeId) => ({
          courseId,
          courseTypeId: typeId,
        }))
      );
    }

    // 🧼 Elimina courseTypeId para que no lo intente guardar en tabla principal
    const { courseTypeId, ...rest } = updateData;

    // 🧹 Limpia valores undefined
    const cleanedData = Object.fromEntries(
      Object.entries(rest).filter(([_, v]) => v !== undefined)
    );

    // ⏱️ Agrega updatedAt
    const dataToUpdate = {
      ...cleanedData,
      updatedAt: new Date(),
    };

    // 📝 Actualiza el curso
    const result = await db
      .update(courses)
      .set(dataToUpdate)
      .where(eq(courses.id, courseId))
      .returning();

    return result[0];
  } catch (error) {
    console.error('❌ Error al actualizar el curso:', error);
    throw error;
  }
};

export async function updateMateria(
  id: number,
  data: { courseid: number; title?: string; description?: string }
) {
  try {
    const existingMateria = await db
      .select()
      .from(materias)
      .where(eq(materias.id, id))
      .limit(1)
      .then((res) => res[0]);

    if (!existingMateria) {
      console.warn(`⚠️ No se encontró la materia con ID: ${id}`);
      return;
    }

    // 🔁 Si ya tiene mismo courseId, omitir
    if (existingMateria.courseid === data.courseid) {
      console.log(
        `⏭️ Materia ID ${existingMateria.id} ya tiene el mismo courseId ${data.courseid}, se omite`
      );
      return;
    }

    // 🔎 Validar si ya existe duplicado exacto
    const yaExiste = await db
      .select()
      .from(materias)
      .where(
        and(
          eq(materias.title, existingMateria.title.trim()),
          eq(materias.programaId, existingMateria.programaId ?? 0),
          eq(materias.courseid, data.courseid)
        )
      )
      .then((r) => r.length > 0);

    // 🛠️ Si no tiene courseid → actualizar directamente
    if (!existingMateria.courseid) {
      await db
        .update(materias)
        .set({ courseid: data.courseid })
        .where(eq(materias.id, id));

      console.log(
        `✅ Materia actualizada ID ${existingMateria.id} → courseId: ${data.courseid}`
      );
    }
    // 🧬 Si ya tenía otro courseId → clonar si no existe
    else if (!yaExiste) {
      await db.insert(materias).values({
        title: existingMateria.title,
        description: existingMateria.description ?? '',
        courseid: data.courseid,
        ...(existingMateria.programaId
          ? { programaId: existingMateria.programaId }
          : {}),
      });

      console.log(
        `📋 Materia duplicada desde ID ${existingMateria.id} → nuevo courseId: ${data.courseid}`
      );
    } else {
      console.log(
        `⏭️ Ya existe una materia con mismo título, programa y courseId. Se omite duplicado.`
      );
    }

    // 🔁 Propagar a otras materias con mismo título y diferente courseId
    const materiasIguales = await db
      .select()
      .from(materias)
      .where(
        and(
          eq(materias.title, existingMateria.title),
          neq(materias.id, existingMateria.id),
          isNotNull(materias.programaId),
          neq(materias.courseid, data.courseid)
        )
      );

    for (const materia of materiasIguales) {
      // 🛑 Si ya tiene ese courseId → omitir
      if (materia.courseid === data.courseid) {
        console.log(
          `⏭️ Materia ID ${materia.id} ya tiene courseId ${data.courseid}, se omite`
        );
        continue;
      }

      // 🧠 Verifica que no exista ya una clonada
      const yaExisteRelacionada = await db
        .select({ id: materias.id })
        .from(materias)
        .where(
          and(
            eq(materias.title, materia.title),
            eq(materias.programaId, materia.programaId ?? 0),
            eq(materias.courseid, data.courseid)
          )
        )
        .then((r) => r.length > 0);

      if (!yaExisteRelacionada) {
        await db.insert(materias).values({
          title: materia.title,
          description: materia.description ?? '',
          ...(materia.programaId ? { programaId: materia.programaId } : {}),
          courseid: data.courseid,
        });

        console.log(
          `🧬 Materia relacionada duplicada desde ID ${materia.id} → nuevo courseId: ${data.courseid}`
        );
      } else {
        console.log(
          `⏭️ Materia ID ${materia.id} ya fue clonada previamente para courseId ${data.courseid}, se omite`
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error al procesar materia:', error.message);
    } else {
      console.error('❌ Error desconocido al procesar materia:', error);
    }
    throw new Error('Error al procesar la materia');
  }
}

// Eliminar un curso y sus datos asociado
export const deleteCourse = async (courseId: number) => {
  // Primero elimina las inscripciones asociadas al curso
  await db.delete(enrollments).where(eq(enrollments.courseId, courseId));
  // Luego elimina los parámetros asociados al curso
  await deleteParametroByCourseId(courseId);
  // Luego elimina el foro asociado al curso
  await deleteForumByCourseId(courseId);
  // Luego elimina las lecciones asociadas al curso
  await deleteLessonsByCourseId(courseId);
  // Finalmente, elimina el curso
  return db.delete(courses).where(eq(courses.id, courseId));
};

// Obtener los cursos en los que el usuario está inscrito
export const getCoursesByUserIdSimplified = async (userId: string) => {
  try {
    // Realiza la consulta para obtener los cursos en los que el usuario está inscrito
    const coursesData = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        coverImageKey: courses.coverImageKey, // Asegúrate de que este campo existe
      })
      .from(courses)
      .innerJoin(enrollments, eq(enrollments.courseId, courses.id)) // Realiza el join con la tabla de enrollments
      .where(eq(enrollments.userId, userId)); // Filtra por el userId en la tabla de enrollments

    // Verifica los datos obtenidos de la consulta

    // Si no se obtienen cursos, retornar un array vacío
    if (coursesData.length === 0) {
      return [];
    }

    // De lo contrario, devolver los cursos
    return coursesData;
  } catch (error) {
    const errorMessage = isApiError(error)
      ? error.message
      : 'Unknown error occurred';
    throw new Error(`Error al obtener los cursos: ${errorMessage}`);
  }
};

export const getModalidadById = async (modalidadId: number) => {
  return db
    .select({
      id: modalidades.id,
      name: modalidades.name,
      description: modalidades.description,
    })
    .from(modalidades)
    .where(eq(modalidades.id, modalidadId))
    .then((rows) => rows[0]);
};

export const getCoursesByUser = async (userId: string) => {
  return (
    db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        coverImageKey: courses.coverImageKey,
        categoryid: categories.name,
        modalidadesid: modalidades.name,
        nivelid: nivel.name,
        instructor: courses.instructor, // Changed from instructorId
        rating: courses.rating,
        creatorId: courses.creatorId,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      // Removemos el leftJoin con users ya que no es necesario
      .leftJoin(categories, eq(courses.categoryid, categories.id))
      .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
      .leftJoin(nivel, eq(courses.nivelid, nivel.id))
      .where(eq(courses.instructor, userId)) // Changed from instructorId
  );
};
