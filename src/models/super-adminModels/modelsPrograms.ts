import { count, eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import {
  categories,
  courses,
  enrollmentPrograms,
  materias,
  notas,
  programas,
  users,
} from '~/server/db/schema';
import { marcarMatriculasManuales } from '~/server/lib/grupos-programas-sync';

// Interfaz para representar un Programa
export interface Program {
  id: number;
  title: string;
  description: string;
  coverImageKey: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  creatorId: string;
  rating: number;
}

// ✅ Obtener todos los programas con detalles
export const getAllPrograms = async () => {
  return db
    .select({
      id: programas.id,
      title: programas.title,
      description: programas.description,
      coverImageKey: programas.coverImageKey,
      createdAt: programas.createdAt,
      updatedAt: programas.updatedAt,
      rating: programas.rating,
      creatorId: programas.creatorId,
      creatorName: users.name,
    })
    .from(programas)
    .leftJoin(users, eq(programas.creatorId, users.id));
};

// ✅ Obtener un programa por ID con sus materias y cursos
export const getProgramById = async (programaId: number) => {
  const program = await db
    .select({
      id: programas.id,
      title: programas.title,
      description: programas.description,
      coverImageKey: programas.coverImageKey,
      createdAt: programas.createdAt,
      updatedAt: programas.updatedAt,
      rating: programas.rating,
      creatorId: programas.creatorId,
      creatorName: users.name,
    })
    .from(programas)
    .leftJoin(users, eq(programas.creatorId, users.id))
    .where(eq(programas.id, programaId))
    .then((rows) => rows[0]);

  if (!program) {
    throw new Error('Programa no encontrado');
  }

  const subjects = await db
    .select({
      id: materias.id,
      title: materias.title,
      description: materias.description,
      courseId: materias.courseid,
      courseTitle: courses.title,
      category: categories.name,
    })
    .from(materias)
    .leftJoin(courses, eq(materias.courseid, courses.id))
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .where(eq(materias.programaId, programaId));

  return { ...program, subjects };
};

// ✅ Crear un nuevo programa
export const createProgram = async ({
  title,
  description,
  coverImageKey,
  creatorId,
  categoryid,
  rating = 0,
}: {
  title: string;
  description: string;
  coverImageKey: string;
  creatorId: string;
  categoryid: number;
  rating?: number;
}) => {
  return db.insert(programas).values({
    title,
    description,
    coverImageKey,
    creatorId,
    categoryid,
    rating,
  });
};

// ✅ Actualizar un programa existente
export const updateProgram = async (
  programaId: number,
  {
    title,
    description,
    coverImageKey,
    rating,
  }: {
    title: string;
    description: string;
    coverImageKey: string;
    rating: number;
  }
) => {
  return db
    .update(programas)
    .set({
      title,
      description,
      coverImageKey,
      rating,
    })
    .where(eq(programas.id, programaId));
};

// ✅ Eliminar un programa (y todas sus relaciones)
export const deleteProgram = async (programaId: number): Promise<void> => {
  try {
    console.log(`Intentando eliminar el programa con ID: ${programaId}`);

    // 🔎 1️⃣ Verificar y eliminar inscripciones en el programa
    await db
      .delete(enrollmentPrograms)
      .where(eq(enrollmentPrograms.programaId, programaId));
    console.log('Inscripciones eliminadas correctamente.');

    // 🔎 2️⃣ Verificar y eliminar materias asociadas
    await db.delete(materias).where(eq(materias.programaId, programaId));
    console.log('Materias eliminadas correctamente.');

    // 🔎 3️⃣ Eliminar el programa
    await db.delete(programas).where(eq(programas.id, programaId));
    console.log('Programa eliminado correctamente.');
  } catch (error) {
    console.error('ERROR al eliminar el programa:', error);
    throw new Error('Error desconocido al eliminar el programa.');
  }
};

// ✅ Obtener los estudiantes inscritos en un programa
export const getStudentsByProgramId = async (programaId: number) => {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      enrolledAt: enrollmentPrograms.enrolledAt,
    })
    .from(enrollmentPrograms)
    .leftJoin(users, eq(enrollmentPrograms.userId, users.id))
    .where(eq(enrollmentPrograms.programaId, programaId));
};

// ✅ Obtener todas las materias de un programa
export const getSubjectsByProgramId = async (programaId: number) => {
  return db
    .select({
      id: materias.id,
      title: materias.title,
      description: materias.description,
      courseId: materias.courseid,
      courseTitle: courses.title,
    })
    .from(materias)
    .leftJoin(courses, eq(materias.courseid, courses.id))
    .where(eq(materias.programaId, programaId));
};

// ✅ Obtener todas las notas de los estudiantes en un programa
export const getStudentGradesByProgramId = async (programaId: number) => {
  return db
    .select({
      studentId: users.id,
      studentName: users.name,
      subjectId: materias.id,
      subjectTitle: materias.title,
      grade: notas.nota,
    })
    .from(notas)
    .leftJoin(users, eq(notas.userId, users.id))
    .leftJoin(materias, eq(notas.materiaId, materias.id))
    .where(eq(materias.programaId, programaId));
};

// ✅ Inscribir un usuario en un programa
export const enrollUserInProgram = async (
  userId: string,
  programaId: number
) => {
  await db
    .insert(enrollmentPrograms)
    .values({ userId, programaId })
    .onConflictDoNothing({
      target: [enrollmentPrograms.userId, enrollmentPrograms.programaId],
    });
  await marcarMatriculasManuales([userId], programaId);
};

// ✅ Obtener programas en los que un usuario está inscrito
export const getUserPrograms = async (userId: string) => {
  return db
    .select({
      id: programas.id,
      title: programas.title,
      description: programas.description,
      coverImageKey: programas.coverImageKey,
      enrolledAt: enrollmentPrograms.enrolledAt,
    })
    .from(enrollmentPrograms)
    .leftJoin(programas, eq(enrollmentPrograms.programaId, programas.id))
    .where(eq(enrollmentPrograms.userId, userId));
};

// ✅ Obtener la cantidad de estudiantes en un programa
export const getTotalStudentsInProgram = async (
  programaId: number
): Promise<number> => {
  const result = await db
    .select({ totalStudents: count() })
    .from(enrollmentPrograms)
    .where(eq(enrollmentPrograms.programaId, programaId));

  return result[0]?.totalStudents ?? 0;
};
