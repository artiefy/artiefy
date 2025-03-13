import { unstable_cache } from 'next/cache';

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	programas,
	enrollmentPrograms,
	materias,
	courses,
	categories,
} from '~/server/db/schema';

import type { Program } from '~/types';

export const getProgramById = unstable_cache(
	async (id: string): Promise<Program | null> => {
		try {
			// Get program basic data
			const program = await db.query.programas.findFirst({
				where: eq(programas.id, parseInt(id, 10)),
			});

			if (!program) {
				return null;
			}

			// Get materias with their courses and categories in a single query
			const materiasWithCourses = await db
				.select()
				.from(materias)
				.leftJoin(courses, eq(materias.courseid, courses.id))
				.leftJoin(categories, eq(courses.categoryid, categories.id))
				.where(eq(materias.programaId, program.id));

			// Get enrollment count
			const enrollmentCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(enrollmentPrograms)
				.where(eq(enrollmentPrograms.programaId, parseInt(id, 10)))
				.then((result) => Number(result[0]?.count ?? 0));

			// Transform the results including category information
			const transformedMaterias = materiasWithCourses
				.map(({ materias, courses, categories }) => ({
					id: materias.id,
					title: materias.title,
					description: materias.description,
					programaId: materias.programaId,
					courseid: materias.courseid,
					curso: courses
						? {
								...courses,
								totalStudents: enrollmentCount,
								lessons: [],
								requerimientos: [],
								category: categories
									? {
											id: categories.id,
											name: categories.name,
											description: categories.description,
											is_featured: categories.is_featured,
										}
									: undefined,
							}
						: undefined,
				}))
				.filter((materia) => materia.curso);

			// Build final program object
			return {
				id: program.id.toString(),
				title: program.title,
				description: program.description,
				coverImageKey: program.coverImageKey,
				createdAt: program.createdAt ? new Date(program.createdAt) : null,
				updatedAt: program.updatedAt ? new Date(program.updatedAt) : null,
				creatorId: program.creatorId,
				rating: program.rating,
				categoryid: program.categoryid,
				materias: transformedMaterias,
			};
		} catch (error) {
			console.error('Error fetching program:', error);
			return null;
		}
	},
	['program-by-id'],
	{
		revalidate: 3600,
		tags: ['programs'],
	}
);
