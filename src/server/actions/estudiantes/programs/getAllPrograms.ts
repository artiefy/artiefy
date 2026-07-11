'use server';

import { unstable_cache } from 'next/cache';

import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';
import { type BaseCourse, type MateriaWithCourse, type Program } from '~/types';

async function loadAllPrograms(): Promise<Program[]> {
  try {
    const programs = await withRetry(() =>
      db.query.programas.findMany({
        where: (programas, { or, isNull, eq }) =>
          or(isNull(programas.visibility), eq(programas.visibility, true)),
        with: {
          category: true,
          certificationType: true,
          typeProgram: true,
          creator: true,
          materias: {
            with: {
              curso: {
                with: {
                  category: true,
                },
              },
            },
          },
        },
      })
    );

    // Procesar cada programa y sus cursos para obtener instructorName
    const processedPrograms = await Promise.all(
      programs.map(async (program) => {
        // Count distinct related courses: a program links courses through
        // `materias`, and two materias can point to the same courseid, so we
        // dedupe by courseid to match the real number of courses in the DB.
        const coursesCount = new Set(
          program.materias.filter((m) => m.curso).map((m) => m.courseid)
        ).size;
        // TODO: Calcular horas reales cuando el campo duration esté disponible
        const totalHours = coursesCount * 40; // Estimación temporal: 40h por curso

        // Procesar materias con información de instructor
        const materiasWithInstructorName = await Promise.all(
          program.materias.map(async (materia) => {
            if (!materia.curso) {
              return {
                id: materia.id,
                title: materia.title,
                description: materia.description,
                programaId: materia.programaId,
                courseid: materia.courseid,
                curso: undefined,
              };
            }

            let instructorName = 'Educador';

            // Obtener nombre del instructor
            if (materia.curso.instructor) {
              try {
                // Primero intentar obtener de la tabla users
                const dbUser = await db
                  .select()
                  .from(users)
                  .where(eq(users.id, materia.curso.instructor))
                  .limit(1);

                if (dbUser?.[0]?.name) {
                  instructorName = dbUser[0].name;
                } else {
                  // Si no está en DB, intentar con Clerk
                  try {
                    const clerk = await clerkClient();
                    const user = await clerk.users.getUser(
                      materia.curso.instructor
                    );
                    const name =
                      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
                    instructorName = name || 'Educador';
                  } catch {
                    instructorName = 'Educador';
                  }
                }
              } catch {
                instructorName = 'Educador';
              }
            }

            return {
              id: materia.id,
              title: materia.title,
              description: materia.description,
              programaId: materia.programaId,
              courseid: materia.courseid,
              curso: {
                id: materia.curso.id,
                title: materia.curso.title,
                description: materia.curso.description,
                coverImageKey: materia.curso.coverImageKey,
                categoryid: materia.curso.categoryid,
                instructor: materia.curso.instructor,
                instructorName,
                createdAt: materia.curso.createdAt,
                updatedAt: materia.curso.updatedAt,
                creatorId: materia.curso.creatorId,
                rating: materia.curso.rating ?? 0,
                modalidadesid: materia.curso.modalidadesid,
                nivelid: materia.curso.nivelid,
                category: materia.curso.category,
              } as BaseCourse,
            };
          })
        );

        // Obtener el nombre del creador del programa
        let creatorName = 'Artiefy';
        if (program.creatorId && program.creator) {
          creatorName = program.creator.name ?? 'Artiefy';
        } else if (program.creatorId) {
          // Si no viene en la relación, intentar con Clerk
          try {
            const clerk = await clerkClient();
            const user = await clerk.users.getUser(program.creatorId);
            const name =
              `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
            creatorName = name || 'Artiefy';
          } catch {
            creatorName = 'Artiefy';
          }
        }

        // Excluir creator del spread para evitar conflictos de tipos
        const { creator, ...programData } = program;

        return {
          ...programData,
          id: program.id.toString(),
          rating: program.rating ?? 0,
          coursesCount,
          totalHours,
          creatorName,
          certificationType: program.certificationType
            ? {
                id: program.certificationType.id,
                name: program.certificationType.name,
                description: program.certificationType.description,
              }
            : undefined,
          idTypesPrograms: program.idTypesPrograms,
          typeProgram: program.typeProgram
            ? {
                id: program.typeProgram.id,
                type: program.typeProgram.type,
              }
            : null,
          materias: materiasWithInstructorName as MateriaWithCourse[],
        };
      })
    );

    return processedPrograms;
  } catch (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
}

// Programs resolve instructor names through per-course DB lookups and Clerk
// calls, so this is expensive. Cache it across requests with a 60s window and
// invalidate with `revalidateTag('programs')` from the program create/update
// flows for instant (0s) invalidation.
export const getAllPrograms = unstable_cache(
  loadAllPrograms,
  ['all-programs'],
  {
    revalidate: 60,
    tags: ['programs'],
  }
);
