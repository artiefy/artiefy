import { NextResponse } from 'next/server';

import { eq, inArray, and } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments } from '~/server/db/schema';

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			courseId: string;
			userIds: string[];
		};

		const { courseId, userIds } = body;

		// 🔹 Convertir courseId a número (porque en DB es integer)
		const parsedCourseId = Number(courseId);
		if (isNaN(parsedCourseId)) {
			return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
		}

		// 🔹 Validar que userIds sean un array de strings
		if (
			!Array.isArray(userIds) ||
			!userIds.every((id) => typeof id === 'string' && id.trim() !== '')
		) {
			return NextResponse.json({ error: 'userIds inválidos' }, { status: 400 });
		}

		// 🔹 Obtener los estudiantes ya inscritos en el curso
		const existingEnrollments = await db
			.select({ userId: enrollments.userId }) // Asegurar que solo seleccionamos userId
			.from(enrollments)
			.where(
				and(
					eq(enrollments.courseId, parsedCourseId), // Comparación con integer
					inArray(enrollments.userId, userIds)
				)
			) // Filtrar por los IDs de usuarios
			.execute(); // 🔥 Usar .execute() para evitar errores de tipado

		// 🔹 Obtener usuarios que ya están inscritos
		const existingUserIds = existingEnrollments.map((e) => e.userId);
		const newUsers = userIds.filter((id) => !existingUserIds.includes(id));

		// 🔹 Insertar solo los nuevos usuarios
		if (newUsers.length > 0) {
			await db.insert(enrollments).values(
				newUsers.map((userId) => ({
					userId,
					courseId: parsedCourseId, // 🔥 Asegurar que courseId es un número
					enrolledAt: new Date(),
					completed: false,
				}))
			);
		}
		// 🔹 Construir el mensaje de respuesta
		const message = `✅ Se asignaron ${newUsers.length} estudiantes al curso. 
		⚠️ ${existingUserIds.length} ya estaban inscritos.`;

		// 🔹 Responder con la cantidad de usuarios agregados
		return NextResponse.json({
			added: newUsers.length,
			alreadyEnrolled: existingUserIds.length,
			message,
		});
	} catch (error) {
		console.error('Error al asignar estudiantes:', error);

		// 🔹 Manejo seguro del error para evitar "no-unsafe-assignment"
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
