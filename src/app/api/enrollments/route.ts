import { eq, inArray, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { enrollments, users } from '~/server/db/schema';

const BATCH_SIZE = 100;

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			courseId: string;
			userIds: string[];
		};

		const { courseId, userIds } = body;

		// 🔹 Validaciones básicas
		const parsedCourseId = Number(courseId);
		if (isNaN(parsedCourseId)) {
			return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
		}

		if (!Array.isArray(userIds) || userIds.some((id) => !id.trim())) {
			return NextResponse.json({ error: 'userIds inválidos' }, { status: 400 });
		}

		// 🔹 Verificar que los userIds existen en la tabla users
		const existingUsers = await db
			.select({ id: users.id })
			.from(users)
			.where(inArray(users.id, userIds))
			.execute();

		const validUserIds = new Set(existingUsers.map((u) => u.id)); // IDs válidos en la DB
		const filteredUserIds = userIds.filter((id) => validUserIds.has(id)); // Solo IDs válidos

		if (filteredUserIds.length === 0) {
			return NextResponse.json(
				{ error: 'Ninguno de los usuarios existe en la base de datos.' },
				{ status: 400 }
			);
		}

		// 🔹 Obtener los estudiantes ya inscritos en el curso
		const existingEnrollments = await db
			.select({ userId: enrollments.userId })
			.from(enrollments)
			.where(
				and(
					eq(enrollments.courseId, parsedCourseId),
					inArray(enrollments.userId, filteredUserIds)
				)
			)
			.execute();

		const existingUserIds = new Set(existingEnrollments.map((e) => e.userId));
		const newUsers = filteredUserIds.filter((id) => !existingUserIds.has(id));

		// 🔹 Insertar solo los nuevos usuarios en lotes
		if (newUsers.length > 0) {
			for (let i = 0; i < newUsers.length; i += BATCH_SIZE) {
				const batch = newUsers.slice(i, i + BATCH_SIZE);
				await db.insert(enrollments).values(
					batch.map((userId) => ({
						userId,
						courseId: parsedCourseId,
						enrolledAt: new Date(),
						completed: false,
					}))
				);
			}
		}

		const message = `Se asignaron ${newUsers.length} estudiantes al curso. ${existingUserIds.size} ya estaban inscritos.`;

		return NextResponse.json({
			added: newUsers.length,
			alreadyEnrolled: existingUserIds.size,
			message,
		});
	} catch (error) {
		console.error('❌ Error al asignar estudiantes:', error);
		const errorMessage =
			error instanceof Error ? error.message : 'Error desconocido';
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
