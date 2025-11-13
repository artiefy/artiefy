import { count, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  courses,
  enrollments,
  modalidades,
  nivel as nivel,
  users,
} from '~/server/db/schema';

import { deleteForumByCourseId } from './forumAndPosts'; // Importar la función para eliminar foros
import { deleteLessonsByCourseId } from './lessonsModels';

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
  categoryid: number;
  modalidadesid: number;
  nivelid: number;
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
  nivelid,
  instructor,
  creatorId,
}: {
  title: string;
  description: string;
  coverImageKey: string;
  categoryid: number;
  modalidadesid: number;
  nivelid: number;
  instructor: string;
  creatorId: string;
}) => {
  return db.insert(courses).values({
    title,
    description,
    coverImageKey,
    categoryid,
    modalidadesid,
    nivelid,
    instructor,
    creatorId,
    courseTypeId: 1, // Replace '1' with the appropriate value for courseTypeId
  });
};

export const getCoursesByUserId = async (userId: string) => {
  console.log('UserId recibido:', userId);
  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      coverImageKey: courses.coverImageKey,
      categoryid: categories.name,
      modalidadesid: modalidades.name,
      nivelid: nivel.name,
      instructor: users.name, // ✅ Ahora trae el NOMBRE
      instructorId: courses.instructor, // ✅ Opcional: mantener el ID
      creatorId: courses.creatorId,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(users, eq(courses.instructor, users.id))
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

// Obtener un curso por ID
export const getCourseById = async (courseId: number) => {
  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      coverImageKey: courses.coverImageKey,
      categoryid: courses.categoryid, // ✅ Ahora devuelve el ID, no el nombre
      modalidadesid: courses.modalidadesid, // ✅ Ahora devuelve el ID, no el nombre
      nivelid: courses.nivelid, // ✅ Ahora devuelve el ID, no el nombre
      instructor: courses.instructor,
      creatorId: courses.creatorId,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .where(eq(courses.id, courseId))
    .then((rows) => rows[0]);
};

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
      instructor: users.name, // ✅ Ahora trae el NOMBRE del instructor
      instructorId: courses.instructor, // ✅ Opcional: mantener el ID si lo necesitas
      creatorId: courses.creatorId,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(nivel, eq(courses.nivelid, nivel.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .leftJoin(users, eq(courses.instructor, users.id)); // ✅ Agregado el JOIN con users
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
    nivelid,
    instructor,
  }: {
    title: string;
    description: string;
    coverImageKey: string;
    categoryid: number;
    modalidadesid: number;
    nivelid: number;
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
      nivelid,
      instructor,
    })
    .where(eq(courses.id, courseId));
};

export const deleteCourse = async (courseId: number): Promise<void> => {
  try {
    console.log(`🔍 Intentando eliminar el curso con ID: ${courseId}`);

    // 🔎 1️⃣ Verificar inscripciones antes de eliminarlas
    const enrollmentsToDelete = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));

    console.log(
      `📌 Inscripciones encontradas ANTES de eliminar: ${enrollmentsToDelete.length}`
    );

    if (enrollmentsToDelete.length > 0) {
      console.log(`🚀 Eliminando inscripciones del curso ${courseId}...`);
      await db.delete(enrollments).where(eq(enrollments.courseId, courseId));
      console.log('✅ Inscripciones eliminadas correctamente.');
    } else {
      console.log('⚠️ No se encontraron inscripciones en el curso.');
    }

    // 🔎 2️⃣ Verificar que las inscripciones fueron eliminadas
    const enrollmentsAfterDelete = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));

    console.log(
      `📌 Inscripciones DESPUÉS de eliminar: ${enrollmentsAfterDelete.length}`
    );

    if (enrollmentsAfterDelete.length > 0) {
      throw new Error(
        '❌ ERROR: Inscripciones NO eliminadas. No se puede proceder con la eliminación del curso.'
      );
    }

    // 🔎 3️⃣ Eliminar foros asociados al curso
    console.log(`📌 Eliminando foros asociados al curso ${courseId}...`);
    await deleteForumByCourseId(courseId);
    console.log('✅ Foros eliminados correctamente.');

    // 🔎 4️⃣ Eliminar lecciones asociadas al curso
    console.log(`📌 Eliminando lecciones asociadas al curso ${courseId}...`);
    await deleteLessonsByCourseId(courseId);
    console.log('✅ Lecciones eliminadas correctamente.');

    // 🔎 5️⃣ Finalmente, eliminar el curso
    console.log(`📌 Eliminando curso con ID ${courseId}...`);
    await db.delete(courses).where(eq(courses.id, courseId));
    console.log('✅ Curso eliminado correctamente.');
  } catch {
    console.error('❌ ERROR al eliminar el curso:');

    throw new Error('Error desconocido al eliminar el curso.');
  }
};

export async function getAllEducators(query?: string) {
  try {
    // Fetch educators from database
    const educators = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email, // ⬅️ AGREGADO: traer el email desde la BD
      })
      .from(users)
      .where(eq(users.role, 'educador'));

    // Filter by query if provided
    if (query) {
      return educators.filter((user) =>
        user.name?.toLowerCase().includes(query.toLowerCase())
      );
    }

    return educators;
  } catch (error) {
    console.error(
      '❌ Error al obtener educadores desde la base de datos:',
      error
    );
    throw new Error('Error al obtener educadores desde la base de datos');
  }
}

// ✅ Actualizar el instructor asignado a un curso
export const updateCourseInstructor = async (
  courseId: number,
  newInstructor: string
) => {
  console.log('📌 Actualizando instructor:', {
    courseId,
    newInstructor,
  });

  try {
    const result = await db
      .update(courses)
      .set({ instructor: newInstructor })
      .where(eq(courses.id, courseId))
      .returning({
        updatedId: courses.id,
        updatedInstructor: courses.instructor,
      });

    return result[0];
  } catch (error) {
    console.error('❌ Error en updateCourseInstructor:', error);
    throw error;
  }
};

export const getCoursesByUserIdSimplified = async (userId: string) => {
  console.log('UserId recibido:', userId); // Verifica que el ID sea correcto

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

    console.log('Cursos obtenidos:', coursesData);

    // Si no se obtienen cursos, retornar un array vacío
    if (coursesData.length === 0) {
      console.log('No se encontraron cursos para el usuario');
      return [];
    }

    // De lo contrario, devolver los cursos
    return coursesData;
  } catch (error) {
    console.error('Error al obtener los cursos:', error);
    throw new Error('Error al obtener los cursos');
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
