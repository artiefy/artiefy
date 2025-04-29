import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import {
	getAllEducators,
} from '~/models/super-adminModels/courseModelsSuperAdmin';
import { db } from '~/server/db';
import { courses } from '~/server/db/schema';



// ✅ Obtener la lista de educadores
export async function GET() {
	try {
		console.log('📌 [API] Solicitando lista de educadores...');

		const educators = await getAllEducators();

		// Transform the data to include only what we need
		const formattedEducators = educators.map((educator) => ({
			id: educator.id,
			name: educator.name ?? 'Sin nombre', // Use name from users table
		}));

		if (!formattedEducators || formattedEducators.length === 0) {
			console.warn('⚠️ [API] No hay educadores disponibles');
			return NextResponse.json(
				{ error: 'No hay educadores disponibles' },
				{ status: 404 }
			);
		}

		return NextResponse.json(formattedEducators);
	} catch (error) {
		console.error('❌ [API] Error al obtener educadores:', error);
		return NextResponse.json(
			{ error: 'Error al obtener educadores' },
			{ status: 500 }
		);
	}
}

// ✅ Actualizar el educador de un curso
export async function PUT(req: Request) {
	try {
		const body = (await req.json()) as {
			courseId: number;
			newInstructor: string;
		};

		if (!body.courseId || !body.newInstructor) {
			return NextResponse.json(
				{ error: 'Se requiere courseId y newInstructor' },
				{ status: 400 }
			);
		}

		console.log('📌 Recibiendo actualización de instructor:', {
			courseId: body.courseId,
			newInstructor: body.newInstructor,
		});

		// Update course with instructor directly
		const result = await db
			.update(courses)
			.set({
				instructor: body.newInstructor,
				updatedAt: new Date(),
			})
			.where(eq(courses.id, body.courseId))
			.returning();

		console.log('✅ Resultado de la actualización:', result);

		if (!result.length) {
			return NextResponse.json(
				{ error: 'No se encontró el curso' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: 'Instructor actualizado exitosamente',
			course: result[0],
		});
	} catch (error) {
		console.error('❌ Error al actualizar el instructor:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar el instructor' },
			{ status: 500 }
		);
	}
}
