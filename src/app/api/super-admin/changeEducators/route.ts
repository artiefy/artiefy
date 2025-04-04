import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';

import {
	getAllEducators,
	updateCourseInstructor,
} from '~/models/super-adminModels/courseModelsSuperAdmin';

// ✅ Definir tipo de datos esperado
interface ChangeEducatorRequest {
	courseId: number;
	newInstructor: string;
}

// ✅ Obtener la lista de educadores
export async function GET() {
	try {
		console.log('📌 [API] Solicitando lista de educadores...');

		const educators = await getAllEducators();

		// Transform the data to include only what we need
		const formattedEducators = educators.map((educator) => ({
			id: educator.id,
			name: educator.name || 'Sin nombre', // Use name from users table
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
		const body = (await req.json()) as ChangeEducatorRequest;

		if (!body.courseId || !body.newInstructor) {
			return NextResponse.json(
				{ error: 'Se requiere courseId e instructorId' },
				{ status: 400 }
			);
		}

		// Update course with instructor ID directly
		await updateCourseInstructor(body.courseId, body.newInstructor);

		return NextResponse.json({
			success: true,
			message: '✅ Educador actualizado exitosamente',
			instructorId: body.newInstructor,
		});
	} catch (error) {
		console.error('❌ Error al actualizar el educador:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar educador' },
			{ status: 500 }
		);
	}
}
