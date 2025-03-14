import { unstable_cache } from 'next/cache';

import { desc, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas, enrollmentPrograms } from '~/server/db/schema';

import type { Program, MateriaWithCourse } from '~/types';



interface CreateProgramInput {
    title: string;
    description: string;
    coverImageKey: string;
    categoryid: number;
    rating: number;
    creatorId: string;
}


export const getAllPrograms = unstable_cache(
    async (): Promise<Program[]> => {
        try {
            const programs = await db.query.programas.findMany({
                with: {
                    materias: {
                        with: {
                            curso: true,
                        },
                    },
                    category: true,
                },
                orderBy: [desc(programas.createdAt)],
            });

            const programsWithEnrollments = await Promise.all(
                programs.map(async (program) => {
                    const enrollmentCount = await db
                        .select({ count: sql<number>`count(*)` })
                        .from(enrollmentPrograms)
                        .where(eq(enrollmentPrograms.programaId, program.id))
                        .then((result) => Number(result[0]?.count ?? 0));

                    return {
                        ...program,
                        totalStudents: enrollmentCount,
                    };
                })
            );

            return programsWithEnrollments.map((program) => {
                const transformedMaterias: MateriaWithCourse[] = program.materias.map(
                    (materia) => ({
                        id: materia.id,
                        title: materia.title,
                        description: materia.description,
                        programaId: materia.programaId,
                        courseid: materia.courseid,
                        curso: materia.curso ?? undefined,
                    })
                );

                return {
                    id: program.id.toString(),
                    title: program.title,
                    description: program.description,
                    coverImageKey: program.coverImageKey,
                    createdAt: program.createdAt,
                    updatedAt: program.updatedAt,
                    creatorId: program.creatorId,
                    rating: program.rating,
                    categoryid: program.categoryid,
                    materias: transformedMaterias,
                    category: program.category,
                    totalStudents: program.totalStudents,
                };
            });
        } catch (error) {
            console.error('Error fetching programs:', error);
            return [];
        }
    },
    ['all-programs'],
    {
        revalidate: 3600,
        tags: ['programs'],
    }
);



export async function createProgram(input: CreateProgramInput) {
    const { title, description, coverImageKey, categoryid, rating, creatorId } = input;

    const newProgram = await db.insert(programas).values({
        title,
        description,
        coverImageKey,
        categoryid,
        rating,
        creatorId,
    }).returning();

    return newProgram;
}

export async function updateProgram(
    id: number,
    input: Partial<CreateProgramInput>
) {
    const updatedProgram = await db.update(programas)
        .set(input)
        .where(eq(programas.id, id))
        .returning();

    return updatedProgram;
}

// Eliminar un programa
export const deleteProgram = async (programId: number): Promise<void> => {
    await db.delete(programas).where(eq(programas.id, programId)).execute();
};
