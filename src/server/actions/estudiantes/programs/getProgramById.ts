'use server';

import { eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas, users } from '~/server/db/schema';
import {
  type BaseCourse,
  type Category,
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
      categoryid: number;
      creatorId: string;
      instructor: string;
      createdAt: Date | null; // <-- agrega estos campos
      updatedAt: Date | null; // <-- agrega estos campos
      rating: number | null; // <-- add this
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
    };
  }[];
}

export const getProgramById = async (id: string): Promise<Program | null> => {
  try {
    const program = (await db.query.programas.findFirst({
      where: eq(programas.id, parseInt(id, 10)),
      with: {
        category: true,
        materias: {
          orderBy: (materias, { asc }) => [asc(materias.id)],
          with: {
            curso: {
              columns: {
                id: true,
                title: true,
                description: true,
                coverImageKey: true,
                categoryid: true,
                creatorId: true,
                instructor: true,
                createdAt: true, // <-- agrega esto
                updatedAt: true, // <-- agrega esto
                rating: true, // <-- add this
                isActive: true,
              },
              with: {
                category: true,
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
                modalidadesid: 1,
                nivelid: 1,
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
