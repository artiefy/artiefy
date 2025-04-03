import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { eq, inArray, and } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments, users } from '~/server/db/schema';

const BATCH_SIZE = 100;

export async function POST(request: Request) {
	try {
		// Validar que el request tenga body
		if (!request.body) {
			console.error('❌ Request sin body');
			return NextResponse.json({ error: 'Request inválido' }, { status: 400 });
		}

		interface EnrollmentRequest {
			courseId: number | string;
			userIds: string[];
			planType: 'Pro' | 'Premium' | 'Enterprise';
		}

		const body = (await request.json()) as EnrollmentRequest;

		// Validar estructura del body
		if (!body || typeof body !== 'object') {
			console.error('❌ Body inválido:', body);
			return NextResponse.json(
				{ error: 'Formato de datos inválido' },
				{ status: 400 }
			);
		}

		const { courseId, userIds, planType } = body;

		// Logging para debug
		console.log('📥 Datos recibidos:', { courseId, userIds, planType });

		// Validaciones detalladas
		if (!courseId) {
			console.error('❌ courseId faltante');
			return NextResponse.json(
				{ error: 'courseId es requerido' },
				{ status: 400 }
			);
		}

		if (!userIds) {
			console.error('❌ userIds faltante');
			return NextResponse.json(
				{ error: 'userIds es requerido' },
				{ status: 400 }
			);
		}

		if (!planType) {
			console.error('❌ planType faltante');
			return NextResponse.json(
				{ error: 'planType es requerido' },
				{ status: 400 }
			);
		}

		// Validar courseId
		const parsedCourseId = Number(courseId);
		if (isNaN(parsedCourseId)) {
			console.error('❌ courseId inválido:', courseId);
			return NextResponse.json(
				{ error: 'courseId debe ser un número válido' },
				{ status: 400 }
			);
		}

		// Validar userIds
		if (!Array.isArray(userIds)) {
			console.error('❌ userIds no es un array:', userIds);
			return NextResponse.json(
				{ error: 'userIds debe ser un array' },
				{ status: 400 }
			);
		}

		if (userIds.length === 0) {
			console.error('❌ userIds está vacío');
			return NextResponse.json(
				{ error: 'Debe proporcionar al menos un userId' },
				{ status: 400 }
			);
		}

		if (userIds.some((id) => !id || typeof id !== 'string')) {
			console.error('❌ userIds contiene valores inválidos:', userIds);
			return NextResponse.json(
				{ error: 'Todos los userIds deben ser strings válidos' },
				{ status: 400 }
			);
		}

		// Verificar usuarios existentes
		const existingUsers = await db
			.select({ id: users.id })
			.from(users)
			.where(inArray(users.id, userIds))
			.execute();

		console.log('📊 Usuarios encontrados:', existingUsers.length);

		const validUserIds = new Set(existingUsers.map((u) => u.id));
		const filteredUserIds = userIds.filter((id) => validUserIds.has(id));

		if (filteredUserIds.length === 0) {
			console.error('❌ Ningún usuario válido encontrado');
			return NextResponse.json(
				{ error: 'Ninguno de los usuarios existe en la base de datos' },
				{ status: 400 }
			);
		}

		// Verificar inscripciones existentes
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

		// Insertar nuevas inscripciones
		if (newUsers.length > 0) {
			try {
				// Actualizar suscripciones de usuarios
				const oneMonthFromNow = new Date();
				oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

				// Format date for Clerk
				const formattedDate =
					oneMonthFromNow.toISOString().slice(0, 10) + ' 23:59:59';

				await db
					.update(users)
					.set({
						subscriptionStatus: 'active',
						planType: planType,
						subscriptionEndDate: oneMonthFromNow,
					})
					.where(inArray(users.id, newUsers));

				const clerk = await clerkClient();
				await Promise.all(
					newUsers.map(async (userId) => {
						await clerk.users.updateUser(userId, {
							publicMetadata: {
								subscriptionStatus: 'active',
								subscriptionEndDate: formattedDate,
								planType: planType,
							},
						});
					})
				);

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
				console.log(
					'✅ Inscripciones y suscripciones actualizadas:',
					newUsers.length
				);
			} catch (error) {
				console.error('❌ Error en actualización:', error);
				throw error;
			}
		}

		const message = `Se asignaron ${newUsers.length} estudiantes al curso. ${existingUserIds.size} ya estaban inscritos.`;

		return NextResponse.json({
			success: true,
			added: newUsers.length,
			alreadyEnrolled: existingUserIds.size,
			message,
		});
	} catch (error) {
		console.error('❌ Error general:', error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : 'Error interno del servidor',
				details:
					process.env.NODE_ENV === 'development' ? String(error) : undefined,
			},
			{ status: 500 }
		);
	}
}
