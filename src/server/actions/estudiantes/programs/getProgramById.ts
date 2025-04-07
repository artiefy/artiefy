'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas } from '~/server/db/schema';
import {
	type Program,
	type MateriaWithCourse,
	type BaseCourse,
	type Category,
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
							instructor: materia.curso.creatorId,
							instructorName: materia.curso.creator?.name ?? 'No disponible',
							createdAt: new Date(), // Add missing properties
							updatedAt: new Date(),
							creatorId: materia.curso.creatorId,
							rating: 0, // Default value for rating
							modalidadesid: 1, // Default value for modalidadesid
							nivelid: 1, // Default value for nivelid
							modalidad: materia.curso.modalidad ?? undefined,
							category: materia.curso.category,
							isActive: materia.curso.isActive ?? true,
						} as BaseCourse)
					: undefined,
			})
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
