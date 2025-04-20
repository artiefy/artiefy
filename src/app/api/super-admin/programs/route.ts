import { type NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq, inArray, and, isNotNull, ne } from 'drizzle-orm';
import { z } from 'zod';

import {
	createProgram,
	updateProgram,
} from '~/models/super-adminModels/programModelsSuperAdmin';

import { db } from '~/server/db';
import { materias, users } from '~/server/db/schema';


export async function POST(req: NextRequest) {
	try {
		const { userId } = (await auth()) as { userId: string | null };
		console.log('✅ Usuario autenticado:', userId);
		console.log('📌 Recibiendo solicitud POST...');
		if (!userId) {
			console.error('❌ Error: Usuario no autenticado.');
			return NextResponse.json(
				{ error: 'Usuario no autenticado.' },
				{ status: 401 }
			);
		}

		// Check if user exists in database
		const existingUser = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.id, userId),
		});

		// If user doesn't exist, create them
		if (!existingUser) {
			const clerk = await clerkClient();
			const clerkUser = await clerk.users.getUser(userId);
			await db.insert(users).values({
				id: userId,
				role: 'super-admin',
				name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
				email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		const schema = z.object({
			title: z.string(),
			description: z.string(),
			coverImageKey: z.string().optional(),
			categoryid: z.number(), // Cambiado a number
			rating: z.number().optional(), // Cambiado a number
			subjectIds: z.array(z.number()).optional(),
		});

		const body = schema.parse(await req.json()); // 📌 Validar y parsear JSON
		// Validar los campos requeridos manualmente
		const {
			title,
			description,
			coverImageKey,
			categoryid,
			rating,
			subjectIds = [],
		} = body;

		if (!title || !description || !categoryid) {
			console.error('❌ Error: Campos requeridos faltantes.');
			return NextResponse.json(
				{ error: 'Faltan campos requeridos: title, description, categoryid.' },
				{ status: 400 }
			);
		}

		// Crear el programa en la base de datos
		console.log('📤 Insertando programa en la base de datos...');
		const newProgram = await createProgram({
			title,
			description,
			coverImageKey: coverImageKey ?? null,
			categoryid: Number(categoryid),
			rating: rating ? Number(rating) : null,
			creatorId: userId,
		});
		console.log('✅ Programa insertado con ID:', newProgram.id);

		// Obtener las materias seleccionadas del cuerpo de la solicitud
		// 📌 Extraer subjectIds del request

		if (
			!Array.isArray(subjectIds) ||
			subjectIds.some((id) => typeof id !== 'number')
		) {
			console.error('❌ Error: subjectIds no es un array válido de números');
			return NextResponse.json(
				{ error: 'subjectIds debe ser un array de números.' },
				{ status: 400 }
			);
		}
		// 📌 Validar y actualizar materias
		if (subjectIds.length > 0) {
			console.log('📌 Actualizando materias:', subjectIds);

			// Validar que las materias existan antes de actualizar
			const existingMaterias = await db
				.select()
				.from(materias)
				.where(inArray(materias.id, subjectIds));

			if (existingMaterias.length === 0) {
				return NextResponse.json(
					{ error: 'No existen materias con los IDs proporcionados' },
					{ status: 400 }
				);
			}

			for (const materia of existingMaterias) {
				if (materia.courseid) {
					// Si ya tiene curso, duplicar la materia en el nuevo programa
					await db
						.insert(materias)
						.values({
							title: materia.title,
							description: materia.description,
							programaId: newProgram.id,
							courseid: materia.courseid,
						})
						.execute();
				} else {
					// Buscar si existen versiones de esa materia con curso en otros programas
					const materiasConCurso = await db
						.select()
						.from(materias)
						.where(
							and(
								eq(materias.title, materia.title),
								isNotNull(materias.courseid),
								isNotNull(materias.programaId),
								ne(materias.programaId, newProgram.id)
							)
						);

					if (materiasConCurso.length > 0) {
						// Por cada curso encontrado, duplicar la materia con ese curso y el nuevo programa
						for (const materiaCurso of materiasConCurso) {
							await db
								.insert(materias)
								.values({
									title: materiaCurso.title,
									description: materiaCurso.description,
									programaId: newProgram.id,
									courseid: materiaCurso.courseid,
								})
								.execute();
						}
					} else {
						// Si no hay cursos asociados, simplemente actualizar la materia original
						if (materia.programaId) {
							// Si ya tiene un programa, duplicar para no tocar la original
							await db
								.insert(materias)
								.values({
									title: materia.title,
									description: materia.description,
									programaId: newProgram.id,
									courseid: null,
								})
								.execute();
						} else {
							// Si no tiene programa, puedes actualizarla
							await db
								.update(materias)
								.set({ programaId: newProgram.id, courseid: null })
								.where(eq(materias.id, materia.id))
								.execute();
						}
					}
				}
			}
		}

		console.log('✅ Materias asignadas al programa:', subjectIds);

		console.log('✅ Programa insertado:', newProgram);
		return NextResponse.json(newProgram, { status: 201 });
	} catch (error) {
		const errorMessage = (error as Error).message;
		console.error('❌ Error al crear el programa:', errorMessage);
		return NextResponse.json(
			{ error: 'Error al crear el programa', details: errorMessage },
			{ status: 500 }
		);
	}
}

export async function PUT(req: NextRequest) {
	try {
		const { userId } = (await auth()) as { userId: string | null };
		if (!userId) {
			return NextResponse.json(
				{ error: 'Usuario no autenticado.' },
				{ status: 401 }
			);
		}

		// Check if user exists in database
		const existingUser = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.id, userId),
		});

		// If user doesn't exist, create them
		if (!existingUser) {
			const clerk = await clerkClient();
			const clerkUser = await clerk.users.getUser(userId);
			await db.insert(users).values({
				id: userId,
				role: 'super-admin',
				name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
				email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		// Get programId from query params
		const { searchParams } = new URL(req.url);
		const programId = searchParams.get('programId');

		if (!programId) {
			return NextResponse.json(
				{ error: 'ID de programa requerido' },
				{ status: 400 }
			);
		}

		const schema = z.object({
			title: z.string(),
			description: z.string(),
			coverImageKey: z.string().optional(),
			categoryid: z.number(),
			rating: z.number().optional(),
			subjectIds: z.array(z.number()).optional(),
		});

		const body = schema.parse(await req.json());
		const {
			title,
			description,
			coverImageKey,
			categoryid,
			rating,
			subjectIds = [],
		} = body;

		// Update program
		const updatedProgram = await updateProgram(parseInt(programId), {
			title,
			description,
			coverImageKey,
			categoryid,
			rating,
			creatorId: userId,
		});

		// Update subject associations
		if (subjectIds.length > 0) {
			// Get existing subjects for this program
			const existingSubjects = await db
				.select()
				.from(materias)
				.where(eq(materias.programaId, parseInt(programId)));

			const existingSubjectIds = existingSubjects.map((subject) => subject.id);

			// Filter out subjects that are already associated
			const newSubjectIds = subjectIds.filter(
				(id) => !existingSubjectIds.includes(id)
			);

			// Process only new subjects
			for (const materiaId of newSubjectIds) {
				const materia = await db
					.select()
					.from(materias)
					.where(eq(materias.id, materiaId))
					.then((res) => res[0]);

				if (!materia) continue;

				if (materia.courseid) {
					// Ya tiene curso → duplicar
					await db.insert(materias).values({
						title: materia.title,
						description: materia.description,
						programaId: Number(updatedProgram.id),
						courseid: materia.courseid,
					});
				} else {
					// Ver si existen otras con curso para ese título
					const materiasConCurso = await db
						.select()
						.from(materias)
						.where(
							and(
								eq(materias.title, materia.title),
								isNotNull(materias.courseid),
								isNotNull(materias.programaId),
								ne(materias.programaId, Number(updatedProgram.id))
							)
						);

					if (materiasConCurso.length > 0) {
						for (const materiaCurso of materiasConCurso) {
							await db.insert(materias).values({
								title: materiaCurso.title,
								description: materiaCurso.description,
								programaId: Number(updatedProgram.id),
								courseid: materiaCurso.courseid,
							});
						}
					} else {
						if (materia.programaId) {
							// Ya tiene programa → duplicar
							await db.insert(materias).values({
								title: materia.title,
								description: materia.description,
								programaId: Number(updatedProgram.id),
								courseid: null,
							});
						} else {
							// No tiene programa aún → actualizar
							await db
								.update(materias)
								.set({ programaId: Number(updatedProgram.id), courseid: null })
								.where(eq(materias.programaId, Number(updatedProgram.id)));
						}
					}
				}
			}
		}

		return NextResponse.json(updatedProgram);
	} catch (error) {
		console.error('Error al actualizar el programa:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el programa' },
			{ status: 500 }
		);
	}
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const programId = searchParams.get('programId'); // Obtener el programId de los parámetros

		if (!programId) {
			return NextResponse.json(
				{ error: 'El programId es obligatorio' },
				{ status: 400 }
			);
		}

		// Filtrar materias donde courseid sea null y pertenezcan al programa
		const filteredMaterias = await db
			.select()
			.from(materias)
			.where(eq(materias.programaId, Number(programId)));

		return NextResponse.json(filteredMaterias);
	} catch (error) {
		console.error('❌ Error fetching subjects:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
