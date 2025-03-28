'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas } from '~/server/db/schema';
import { type Program, type MateriaWithCourse, type BaseCourse } from '~/types';

export const getProgramById = async (id: string): Promise<Program | null> => {
	try {
		const program = await db.query.programas.findFirst({
			where: eq(programas.id, parseInt(id, 10)),
			with: {
				category: true,
				materias: {
					orderBy: (materias, { asc }) => [asc(materias.id)],
					with: {
						curso: {
							with: {
								category: true,
								modalidad: {
									columns: {
										id: true,
										name: true,
										description: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!program) return null;

		// Log raw data for debugging
		console.log(
			'Raw program materias:',
			program.materias.map((m) => ({
				materiaId: m.id,
				cursoId: m.curso?.id,
				modalidadId: m.curso?.modalidadesid,
				modalidad: m.curso?.modalidad,
			}))
		);

		const transformedMaterias: MateriaWithCourse[] = program.materias.map(
			(materia) => ({
				...materia,
				curso: materia.curso
					? ({
							...materia.curso,
							id: materia.curso.id,
							title: materia.curso.title,
							description: materia.curso.description,
							coverImageKey: materia.curso.coverImageKey,
							categoryid: materia.curso.categoryid,
							instructor: materia.curso.instructor,
							modalidad: materia.curso.modalidad ?? undefined,
							isActive: materia.curso.isActive ?? true,
						} as BaseCourse)
					: undefined,
			})
		);

		// Log transformed data for verification
		console.log(
			'Transformed materias:',
			transformedMaterias.map((m) => ({
				materiaId: m.id,
				cursoId: m.curso?.id,
				modalidadName: m.curso?.modalidad?.name,
				isActive: m.curso?.isActive,
			}))
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
};
