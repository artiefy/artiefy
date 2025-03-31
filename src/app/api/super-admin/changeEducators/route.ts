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

		console.log('✅ [API] Educadores obtenidos:', educators);

		if (!educators || educators.length === 0) {
			console.warn('⚠️ [API] No hay educadores disponibles');
			return NextResponse.json(
				{ error: 'No hay educadores disponibles' },
				{ status: 404 }
			);
		}

		return NextResponse.json(educators);
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

		// Properly type the user from Clerk
		const clerk = await clerkClient();
		const user = await clerk.users.getUser(body.newInstructor);
		if (!user) {
			return NextResponse.json(
				{ error: 'Usuario no encontrado' },
				{ status: 404 }
			);
		}

		// Crear el nombre completo del educador
		const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

		// Actualizar el curso con el nombre completo del educador
		await updateCourseInstructor(body.courseId, fullName);

		return NextResponse.json({
			success: true,
			message: '✅ Educador actualizado exitosamente',
		});
	} catch (error) {
		console.error('❌ Error al actualizar el educador:', error);
		return NextResponse.json(
			{ error: 'Error al actualizar educador' },
			{ status: 500 }
		);
	}
}
