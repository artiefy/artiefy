'use server';

import { desc, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas, enrollmentPrograms } from '~/server/db/schema';

import type { Program, Materia } from '~/types';

export async function getAllPrograms(): Promise<Program[]> {
	const programs = await db.query.programas.findMany({
		with: {
			materias: true,
			category: true,
		},
		orderBy: [desc(programas.createdAt)],
	});

	const programsWithEnrollments = await Promise.all(
		programs.map(async (program) => {
			// Get enrollment count for each program
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
		// Safely transform materias with type checking
		const transformedMaterias: Materia[] = program.materias.map((materia) => ({
			id: materia.id,
			title: materia.title,
			description: materia.description ?? '',
			programaId: materia.programaId, // Using correct property name
			courseId: materia.courseid ?? null,
		}));

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
			dificultadid: program.dificultadid,
			materias: transformedMaterias,
			courses: [], // Will be populated later
			requerimientos: program.requerimientos
				? program.requerimientos.split(',')
				: [],
			category: program.category,
			totalStudents: program.totalStudents,
		};
	});
}
