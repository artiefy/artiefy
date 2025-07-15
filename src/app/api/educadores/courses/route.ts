import { type NextRequest, NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq, ne } from 'drizzle-orm';

import {
  createCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getLessonsByCourseId,
  getTotalDuration,
  getTotalStudents,
  updateCourse,
  updateMateria,
} from '~/models/educatorsModels/courseModelsEducator';
import { getSubjects } from '~/models/educatorsModels/subjectModels'; // Import the function to get subjects
import { createUser, getUserById } from '~/models/educatorsModels/userModels'; // Importa las funciones necesarias para manejar usuarios
import { db } from '~/server/db';
import { materias, courses, courseCourseTypes } from '~/server/db/schema';

export const dynamic = 'force-dynamic';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

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

// Función para verificar si el usuario es nuevo y agregarlo a la tabla users
async function ensureUserExists(userId: string) {
  const user = await getUserById(userId);
  if (!user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      await createUser(
        userId,
        'educador',
        `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
        clerkUser.emailAddresses[0].emailAddress
      );
    }
  }
}

// GET endpoint para obtener un curso por su ID
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const userId = searchParams.get('userId');
  const fetchSubjects = searchParams.get('fetchSubjects');

  try {
    if (fetchSubjects) {
      const subjects = await getSubjects();
      return NextResponse.json(subjects);
    }
    let courses;
    if (courseId) {
      const course = await getCourseById(parseInt(courseId));
      const totalStudents = await getTotalStudents(parseInt(courseId));
      const lessons = await getLessonsByCourseId(parseInt(courseId));
      const totalDuration = await getTotalDuration(parseInt(courseId));

      if (!course) {
        return respondWithError('Curso no encontrado', 404);
      }
      courses = {
        ...course,
        totalStudents,
        totalDuration,
        lessons,
      };
    } else if (userId) {
      courses = await getAllCourses();
    } else {
      courses = await getAllCourses();
      // Filter out duplicate titles
      const uniqueCourses = Array.from(
        new Map(courses.map((course) => [course.title, course])).values()
      );
      courses = uniqueCourses;
    }
    return NextResponse.json(courses);
  } catch (error) {
    const errorMessage = isApiError(error)
      ? error.message
      : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Error al obtener los datos: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    await ensureUserExists(userId);

    const body = (await request.json()) as {
      title: string;
      description: string;
      coverImageKey?: string;
      coverVideoCourseKey?: string;
      categoryid: number;
      modalidadesid: number;
      nivelid: number;
      instructorId?: string;
      courseTypeId?: number[]; // ahora array
      individualPrice?: number | null;
      subjects?: { id: number }[]; // ✅ añadimos subjects
    };

    const {
      title,
      description,
      coverImageKey = '',
      coverVideoCourseKey = undefined,
      categoryid,
      modalidadesid,
      nivelid,
      instructorId = userId,
      courseTypeId = [],
      individualPrice = null,
      subjects = [], // ✅ default vacío
    } = body;

    const normalizedTypes = Array.isArray(courseTypeId) ? courseTypeId : [];

    let finalCourseTypeId: number | null = null;
    let finalPrice: number | null = null;

    if (normalizedTypes.length === 1) {
      finalCourseTypeId = normalizedTypes[0];
      if (finalCourseTypeId === 4) {
        finalPrice = individualPrice ?? 0;
      }
    } else if (normalizedTypes.length > 1) {
      finalCourseTypeId = null; // Para tabla intermedia
      if (normalizedTypes.includes(4)) {
        finalPrice = individualPrice ?? 0;
      }
    }

    const courseValues: any = {
      title,
      description,
      coverImageKey,
      coverVideoCourseKey,
      categoryid,
      modalidadesid,
      nivelid,
      instructor: instructorId,
      creatorId: userId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (finalCourseTypeId !== null && finalCourseTypeId !== undefined) {
      courseValues.courseTypeId = finalCourseTypeId;
    }
    if (
      normalizedTypes.includes(4) &&
      finalPrice !== null &&
      finalPrice !== undefined
    ) {
      courseValues.individualPrice = finalPrice;
    }

console.log('🧪 Recibiendo payload en backend:', body);

    const createdCourse = await db
      .insert(courses)
      .values(courseValues)
      .returning()
      .then((res) => res[0]);

    // 🔥 Insertar en tabla intermedia courseCourseTypes si hay varios
    if (normalizedTypes.length > 1) {
      for (const typeId of normalizedTypes) {
        await db.insert(courseCourseTypes).values({
          courseId: createdCourse.id,
          courseTypeId: typeId,
        });
      }
    }

    // 🔥 Asociar materias actualizando courseid en materia
    if (subjects.length > 0) {
      await Promise.all(
        subjects.map(async (subject) => {
          await updateMateria(subject.id, { courseid: createdCourse.id });
          console.log(
            `Materia actualizada: ${subject.id} -> courseId: ${createdCourse.id}`
          );
        })
      );
    } else {
      console.log('No se proporcionaron materias para actualizar.');
    }

    return NextResponse.json({
      message: 'Curso creado exitosamente',
      course: createdCourse,
    });
  } catch (error) {
    console.error('❌ Error en POST /api/educadores/courses:', error);
    return NextResponse.json(
      { error: 'Error interno al crear el curso', details: String(error) },
      { status: 500 }
    );
  }
}

// Actualizar un curso
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return respondWithError('No autorizado', 403);
    }

    const body = (await request.json()) as {
      id: number;
      title: string;
      description: string;
      coverImageKey: string;
      categoryid: number;
      modalidadesid: number;
      nivelid: number;
      instructorId: string; // Changed from instructor to instructorId
      subjects?: { id: number }[];
      courseTypeId?: number | null; // <-- nuevo
      individualPrice?: number | null;
    };

    const {
      id,
      title,
      description,
      coverImageKey,
      modalidadesid,
      nivelid,
      categoryid,
      instructorId, // Updated from instructor
      subjects = [],
      courseTypeId = null, // <-- nuevo
      individualPrice = null,
    } = body;

    const course = await getCourseById(id);
    if (!course) {
      return respondWithError('Curso no encontrado', 404);
    }

    // Update course main data
    await updateCourse(id, {
      title,
      description,
      coverImageKey,
      categoryid,
      modalidadesid,
      instructor: instructorId, // Map instructorId to instructor
      nivelid,
      courseTypeId: Array.isArray(courseTypeId)
        ? courseTypeId
        : courseTypeId !== null && courseTypeId !== undefined
          ? [courseTypeId]
          : [],
      individualPrice,
    });

    // Manejar las materias
    if (subjects.length > 0) {
      const materiasAntes = await db.select().from(materias);

      for (const subject of subjects) {
        const existingMateria = await db
          .select()
          .from(materias)
          .where(eq(materias.id, subject.id))
          .then((res) => res[0]);

        if (existingMateria) {
          if (existingMateria.courseid) {
            // Ya tiene curso, se crea una nueva
            await db.insert(materias).values({
              title: existingMateria.title,
              description: existingMateria.description,
              programaId: existingMateria.programaId,
              courseid: id,
            });
          } else {
            // Se actualiza la existente
            await db
              .update(materias)
              .set({ courseid: id })
              .where(eq(materias.id, subject.id))
              .returning();
          }

          // 🔁 Buscar otras materias iguales por título en otros programas (excepto la actual)
          const conditions = [eq(materias.title, existingMateria.title)];

          if (existingMateria.programaId) {
            conditions.push(
              ne(materias.programaId, existingMateria.programaId)
            );
          }

          const materiasIguales = await db
            .select()
            .from(materias)
            .where(and(...conditions));

          for (const materia of materiasIguales) {
            if (!materia.courseid) {
              // Si no tiene curso, se actualiza
              await db
                .update(materias)
                .set({ courseid: id })
                .where(eq(materias.id, materia.id))
                .returning();
            } else {
              // Si ya tiene curso, se clona con el nuevo curso
              await db.insert(materias).values({
                title: materia.title,
                description: materia.description,
                programaId: materia.programaId,
                courseid: id,
              });
            }
          }
        }
      }

      const materiasDespues = await db.select().from(materias);

      materiasDespues.filter(
        (materiaFinal) =>
          !materiasAntes.some(
            (materiaInicial) => materiaInicial.id === materiaFinal.id
          )
      );
    }

    return NextResponse.json({
      message: 'Curso actualizado exitosamente',
      id:
        course && 'id' in course && typeof course.id === 'number'
          ? course.id
          : id,
    });
  } catch {
    return respondWithError('Error al actualizar el curso', 500);
  }
}

// Eliminar un curso
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'ID no proporcionado' },
        { status: 400 }
      );
    }

    const parsedCourseId = parseInt(courseId);
    await deleteCourse(parsedCourseId);
    return NextResponse.json({ message: 'Curso eliminado exitosamente' });
  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar el curso' },
      { status: 500 }
    );
  }
}
