import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm'; // ✅ Importar inArray
import { z } from 'zod';

import {
	createProgram,
	updateProgram,
} from '~/models/super-adminModels/programModelsSuperAdmin';
import { db } from '~/server/db';
import { materias } from '~/server/db/schema';

export async function POST(req: NextRequest) {
	try {
		// Obtener el usuario autenticado
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

		const schema = z.object({
			title: z.string(),
			description: z.string(),
			coverImageKey: z.string().optional(),
			categoryid: z.number(), // Cambiado a number
			rating: z.number().optional(), // Cambiado a number
			subjectIds: z.array(z.number()).optional(),
		});

		const body = schema.parse(await req.json()); // 📌 Validar y parsear JSON
		console.log('📥 Datos recibidos:', body);
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
		console.log('📌 Actualizando materias con los IDs:', subjectIds);
		if (subjectIds.length > 0) {
			console.log('📌 Actualizando materias:', subjectIds);

			// Validar que las materias existan antes de actualizar
			const existingMaterias = await db
				.select({ id: materias.id })
				.from(materias)
				.where(inArray(materias.id, subjectIds))
				.execute();

			const existingIds = existingMaterias.map((m) => m.id);

			if (existingIds.length === 0) {
				return NextResponse.json(
					{ error: 'No existen materias con los IDs proporcionados' },
					{ status: 400 }
				);
			}

			for (const materiaId of existingIds) {
				const materia = await db
					.select()
					.from(materias)
					.where(eq(materias.id, materiaId))
					.then((res) => res[0]);

				if (materia.courseid) {
					// Si ya tiene courseid, crear una nueva materia duplicando, con courseid en null:
					await db
						.insert(materias)
						.values({
							title: materia.title,
							description: materia.description,
							programaId: newProgram.id,
							courseid: null, // aquí lo dejas null
						})
						.execute();
				} else {
					// Si no tiene courseId, solo actualizamos:
					await db
						.update(materias)
						.set({ programaId: newProgram.id, courseid: null }) // courseid null también aquí
						.where(eq(materias.id, materiaId))
						.execute();
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
			await db
				.update(materias)
				.set({ programaId: null })
				.where(eq(materias.programaId, parseInt(programId)))
				.execute();

			for (const materiaId of subjectIds) {
				const materia = await db
					.select()
					.from(materias)
					.where(eq(materias.id, materiaId))
					.then((res) => res[0]);

				if (materia) {
					if (materia.courseid) {
						await db
							.insert(materias)
							.values({
								title: materia.title,
								description: materia.description,
								programaId: parseInt(programId),
								courseid: null,
							})
							.execute();
					} else {
						await db
							.update(materias)
							.set({ programaId: parseInt(programId) })
							.where(eq(materias.id, materiaId))
							.execute();
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
