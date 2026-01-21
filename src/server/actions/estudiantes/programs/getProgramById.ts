'use server';

import { eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas, users } from '~/server/db/schema';
import {
  type BaseCourse,
  type Category,
  type Lesson,
  type MateriaWithCourse,
  type Program,
} from '~/types';

// Define types for the query result
interface ProgramQueryResult {
  id: number;
  title: string;
  description: string | null;
  coverImageKey: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  creatorId: string;
  rating: number | null;
  categoryid: number;
  category?: {
    id: number;
    name: string;
    description: string | null;
    is_featured: boolean | null;
  };
  materias: {
    id: number;
    title: string;
    description: string | null;
    programaId: number;
    courseid: number | null;
    curso?: {
      id: number;
      title: string;
      description: string | null;
      coverImageKey: string | null;
      coverVideoCourseKey: string | null;
      categoryid: number;
      creatorId: string;
      instructor: string;
      createdAt: Date | null; // <-- agrega estos campos
      updatedAt: Date | null; // <-- agrega estos campos
      rating: number | null; // <-- add this
      modalidadesid: number | null;
      nivelid: number | null;
      horario: string | null;
      espacios: string | null;
      is_featured: boolean | null;
      is_top: boolean | null;
      creator: {
        id: string;
        name: string;
      };
      modalidad?: {
        id: number;
        name: string;
        description: string | null;
      };
      category?: {
        id: number;
        name: string;
        description: string | null;
        is_featured: boolean | null;
      };
      isActive: boolean | null;
      lessons?: {
        id: number;
        title: string;
        description: string | null;
        duration: number;
        orderIndex: number | null;
        coverImageKey: string;
        coverVideoKey: string;
        courseId: number;
        createdAt: Date | null;
        updatedAt: Date | null;
        lastUpdated: Date | null;
        resourceKey: string | null;
        resourceNames: string | null;
      }[];
    };
  }[];
}

const parseResourceNames = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === 'string'
        );
      }
    } catch (_error) {
      // Ignorar errores de parseo, se maneja abajo
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const getProgramById = async (
  id: string | number | undefined
): Promise<Program | null> => {
  try {
    // Sanitize and validate the id to avoid passing NaN to the DB driver
    const parsedId =
      typeof id === 'number' ? id : parseInt(String(id ?? ''), 10);
    if (!Number.isFinite(parsedId) || Number.isNaN(parsedId)) {
      console.warn('getProgramById called with invalid id:', id);
      return null;
    }

    const program = (await db.query.programas.findFirst({
      where: eq(programas.id, parsedId),
      with: {
        category: true,
        certificationType: true,
        materias: {
          orderBy: (materias, { asc }) => [asc(materias.id)],
          with: {
            curso: {
              columns: {
                id: true,
                title: true,
                description: true,
                coverImageKey: true,
                coverVideoCourseKey: true,
                categoryid: true,
                creatorId: true,
                instructor: true,
                createdAt: true, // <-- agrega esto
                updatedAt: true, // <-- agrega esto
                rating: true, // <-- add this
                modalidadesid: true,
                nivelid: true,
                horario: true,
                espacios: true,
                is_featured: true,
                is_top: true,
                isActive: true,
              },
              with: {
                category: true,
                lessons: {
                  columns: {
                    id: true,
                    title: true,
                    description: true,
                    duration: true,
                    orderIndex: true,
                    coverImageKey: true,
                    coverVideoKey: true,
                    courseId: true,
                    createdAt: true,
                    updatedAt: true,
                    lastUpdated: true,
                    resourceKey: true,
                    resourceNames: true,
                  },
                  orderBy: (lessons, { asc }) => [
                    asc(lessons.orderIndex),
                    asc(lessons.id),
                  ],
                },
                modalidad: {
                  columns: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
                creator: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })) as ProgramQueryResult;

    if (!program) return null;

    // Recolectar todos los instructor ids únicos de los cursos
    const instructorIds = Array.from(
      new Set(
        program.materias
          .map((materia) => {
            // Safe access to instructor property
            if (
              materia.curso &&
              typeof materia.curso === 'object' &&
              'instructor' in materia.curso
            ) {
              return (materia.curso as { instructor?: string }).instructor;
            }
            return undefined;
          })
          .filter((id): id is string => !!id)
      )
    );

    // Obtener todos los usuarios instructores necesarios
    let instructorsMap: Record<string, string> = {};
    if (instructorIds.length > 0) {
      const instructors = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, instructorIds)); // <-- usar inArray
      instructorsMap = Object.fromEntries(
        instructors.map((u) => [u.id, u.name ?? 'No disponible'])
      );
    }

    const transformedMaterias: MateriaWithCourse[] = program.materias.map(
      (materia) => {
        const mappedLessons: Lesson[] =
          materia.curso?.lessons?.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description ?? null,
            duration: lesson.duration ?? 0,
            coverImageKey: lesson.coverImageKey,
            coverVideoKey: lesson.coverVideoKey,
            courseId: lesson.courseId,
            createdAt: lesson.createdAt ?? new Date(),
            updatedAt: lesson.updatedAt ?? new Date(),
            porcentajecompletado: 0,
            resourceKey: lesson.resourceKey ?? '',
            userProgress: 0,
            isCompleted: false,
            lastUpdated: lesson.lastUpdated ?? lesson.updatedAt ?? new Date(),
            course: undefined,
            activities: [],
            isLocked: null,
            resourceNames: parseResourceNames(lesson.resourceNames),
            isNew: false,
            orderIndex: lesson.orderIndex ?? null,
            videoDuration: null,
          })) ?? [];

        let instructorId = '';
        if (
          materia.curso &&
          typeof materia.curso === 'object' &&
          'instructor' in materia.curso
        ) {
          instructorId =
            (materia.curso as { instructor?: string }).instructor ?? '';
        }
        let instructorName = 'No disponible';
        if (instructorId && instructorsMap[instructorId]) {
          instructorName = instructorsMap[instructorId];
        } else if (
          materia.curso &&
          typeof materia.curso === 'object' &&
          'creator' in materia.curso &&
          materia.curso.creator &&
          'name' in materia.curso.creator
        ) {
          instructorName =
            (materia.curso.creator as { name?: string }).name ??
            'No disponible';
        }

        return {
          ...materia,
          curso: materia.curso
            ? ({
                id: materia.curso.id,
                title: materia.curso.title,
                description: materia.curso.description,
                coverImageKey: materia.curso.coverImageKey,
                categoryid: materia.curso.categoryid,
                instructor: instructorId,
                instructorName: instructorName,
                createdAt: materia.curso.createdAt ?? null,
                updatedAt: materia.curso.updatedAt ?? null,
                creatorId: materia.curso.creatorId,
                rating: materia.curso.rating ?? 0,
                modalidadesid: materia.curso.modalidadesid ?? 1,
                nivelid: materia.curso.nivelid ?? 1,
                coverVideoCourseKey: materia.curso.coverVideoCourseKey ?? null,
                horario: materia.curso.horario ?? null,
                espacios: materia.curso.espacios ?? null,
                is_featured: materia.curso.is_featured ?? null,
                is_top: materia.curso.is_top ?? null,
                lessons: mappedLessons,
                modalidad: materia.curso.modalidad ?? undefined,
                category: materia.curso.category,
                isActive: materia.curso.isActive ?? true,
              } as BaseCourse)
            : undefined,
        };
      }
    );

    const transformedCategory: Category | undefined = program.category
      ? {
          ...program.category,
          courses: { length: 0 },
          preferences: [],
        }
      : undefined;

    return {
      ...program,
      id: program.id.toString(),
      rating: program.rating ?? 0,
      category: transformedCategory,
      materias: transformedMaterias,
    };
  } catch (error) {
    console.error('Error fetching program:', error);
    return null;
  }
};
