import { unstable_cache } from 'next/cache';

import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas, enrollmentPrograms } from '~/server/db/schema';

import type { Course, Program, Materia } from '~/types/super-admin';

export interface ProgramDetails {
	id: number;
	title: string;
	description?: string | null;
	coverImageKey?: string | null;
	categoryid: number;
	creatorId: string;
	createdAt: Date;
	updatedAt: Date;
	rating?: number | null;
	materias: Materia[];
	courses: Course[];
}

// Obtener todos los programas
export const getAllPrograms = async (): Promise<ProgramDetails[]> => {
	const programs = await db.select().from(programas).execute();
	return programs.map((program) => ({
		...program,
		materias: [],
		courses: [],
	}));
};

// Obtener un programa por ID
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
				Nivelid: materia.curso!.nivelid,
				courseTypeId: materia.curso!.courseTypeId ?? 0,
				requiresProgram: false, // Set a default value
				isActive: materia.curso!.isActive ?? false, // Ensure it's not null
				requiresSubscription: false, // Add missing required field
				isFree: true, // Add missing required field with default value
				courseType: {
					requiredSubscriptionLevel: 'none',
					isPurchasableIndividually: null,
					price: null,
				},
			}));

		// Transform materias to match the Materia type
		const transformedMaterias: Materia[] = program.materias
			.filter((materia) => materia.curso !== null) // Filter out materias without curso
			.map((materia) => ({
				id: materia.id,
				title: materia.title,
				description: materia.description ?? '',
				programaId: materia.programaId ?? 0,
				courseId: materia.courseid ?? null,
				courseid: materia.courseid ?? null,
				curso: {
					...materia.curso!,
					totalStudents: enrollmentCount,
					lessons: [],
					Nivelid: materia.curso!.nivelid,
					courseTypeId: materia.curso!.courseTypeId ?? 0,
					requiresProgram: false,
					isActive: materia.curso!.isActive ?? false,
					requiresSubscription: false,
					isFree: true,
					courseType: {
						requiredSubscriptionLevel: 'none',
						isPurchasableIndividually: null,
						price: null,
					},
				},
			}));

		// Build the final program object with proper typing
		const programData: ProgramDetails = {
			id: program.id,
			title: program.title,
			description: program.description,
			coverImageKey: program.coverImageKey,
			createdAt: program.createdAt,
			updatedAt: program.updatedAt,
			creatorId: program.creatorId,
			rating: program.rating,
			categoryid: program.categoryid,
			materias: transformedMaterias,
			courses: transformedCourses,
		};

		return programData;
	},
	['program-by-id'],
	{
		revalidate: 3600, // 1 hora
		tags: ['programs'],
	}
);

// Crear un nuevo program
// Actualizar un programa
export const updateProgram = async (
	programId: number,
	programData: Partial<Program>
): Promise<Program> => {
	const result = await db
		.update(programas)
		.set({
			title: programData.title,
			description: programData.description,
			coverImageKey: programData.coverImageKey,
			categoryid: programData.categoryid,
			creatorId: programData.creatorId,
			updatedAt: new Date(),
			rating: programData.rating,
		})
		.where(eq(programas.id, programId))
		.returning({
			id: programas.id,
			title: programas.title,
			description: programas.description,
			coverImageKey: programas.coverImageKey,
			categoryid: programas.categoryid,
			creatorId: programas.creatorId,
			createdAt: programas.createdAt,
			updatedAt: programas.updatedAt,
			rating: programas.rating,
		})
		.execute();
	return {
		...result[0],
		id: result[0].id.toString(),
	};
};

// Eliminar un programa
export const deleteProgram = async (programId: number): Promise<void> => {
	await db.delete(programas).where(eq(programas.id, programId)).execute();
};

interface CreateProgramInput {
	title: string;
	description: string;
	coverImageKey: string | null;
	categoryid: number;
	rating: number | null;
	creatorId: string;
}

export async function createProgram(data: CreateProgramInput) {
	try {
		const [newProgram] = await db
			.insert(programas)
			.values({
				title: data.title,
				description: data.description,
				coverImageKey: data.coverImageKey,
				categoryid: data.categoryid,
				rating: data.rating,
				creatorId: data.creatorId,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();
		return newProgram;
	} catch (error) {
		console.error(
			'❌ Error al insertar el programa en la base de datos:',
			error
		);
		throw error;
	}
}
