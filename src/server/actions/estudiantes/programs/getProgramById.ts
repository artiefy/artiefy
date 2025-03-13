import { unstable_cache } from 'next/cache';

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas, enrollmentPrograms } from '~/server/db/schema';

import type { Course, Program, Materia } from '~/types';

export const getProgramById = unstable_cache(
	async (id: string) => {
		// Get program data with related materias and courses
		const program = await db.query.programas.findFirst({
			where: eq(programas.id, parseInt(id, 10)),
			with: {
				materias: {
					with: {
						curso: true,
					},
				},
			},
		});

		if (!program) {
			throw new Error('Program not found');
		}

		// Get enrollment count using a separate query
		const enrollmentCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(enrollmentPrograms)
			.where(eq(enrollmentPrograms.programaId, parseInt(id, 10)))
			.then((result) => Number(result[0]?.count ?? 0));

		// Transform courses data to match the Course type
		const transformedCourses: Course[] = program.materias
			.filter((materia) => materia.curso)
			.map((materia) => ({
				...materia.curso!,
				totalStudents: enrollmentCount,
				lessons: [],
				requerimientos: materia.curso!.requerimientos.split(','),
			}));

		// Transform materias to match the Materia type
		const transformedMaterias: Materia[] = program.materias.map((materia) => ({
			id: materia.id,
			title: materia.title,
			description: materia.description ?? '',
			programaId: materia.programaId,
			courseId: materia.courseid,
		}));

		// Build the final program object with proper typing
		const programData: Program = {
			id: program.id.toString(),
			title: program.title,
			description: program.description,
			coverImageKey: program.coverImageKey,
			createdAt: program.createdAt,
			updatedAt: program.updatedAt,
			creatorId: program.creatorId,
			rating: program.rating,
			materias: transformedMaterias,
			courses: transformedCourses,
			requerimientos: program.requerimientos
				? program.requerimientos.split(',')
				: [],
			categoryid: program.categoryid,
			dificultadid: program.dificultadid,
		};

		return programData;
	},
	['program-by-id'],
	{
		revalidate: 3600, // 1 hora
		tags: ['programs'],
	}
);
