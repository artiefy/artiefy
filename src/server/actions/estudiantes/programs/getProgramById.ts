'use server';

import { unstable_cache } from 'next/cache';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas } from '~/server/db/schema';
import { type Program, type MateriaWithCourse, type BaseCourse } from '~/types';

export const getProgramById = unstable_cache(
	async (id: string): Promise<Program | null> => {
		try {
			const program = await db.query.programas.findFirst({
				where: eq(programas.id, parseInt(id, 10)),
				with: {
					category: true,
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
			});

			if (!program) return null;

			// Transform materias to match MateriaWithCourse type
			const transformedMaterias: MateriaWithCourse[] = program.materias.map(
				(materia) => ({
					...materia,
					curso: materia.curso
						? ({
								id: materia.curso.id,
								title: materia.curso.title,
								description: materia.curso.description,
								coverImageKey: materia.curso.coverImageKey,
								categoryid: materia.curso.categoryid,
								instructor: materia.curso.instructor,
								createdAt: materia.curso.createdAt,
								updatedAt: materia.curso.updatedAt,
								creatorId: materia.curso.creatorId,
								rating: materia.curso.rating,
								modalidadesid: materia.curso.modalidadesid,
								nivelid: materia.curso.nivelid,
								category: materia.curso.category,
							} as BaseCourse)
						: undefined,
				})
			);

			return {
				...program,
				id: program.id.toString(),
				rating: program.rating ?? 0,
				category: program.category ?? undefined,
				materias: transformedMaterias,
			};
		} catch (error) {
			console.error(
				'Error fetching program:',
				error instanceof Error ? error.message : 'Unknown error'
			);
			return null;
		}
	},
	['program-by-id'],
	{
		revalidate: 3600,
		tags: ['program'],
	}
);
