import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { eq, inArray, and } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms, users, programas } from '~/server/db/schema';

const BATCH_SIZE = 100;

export async function GET() {
	try {
		const allPrograms = await db.select().from(programas).execute();
		// Use a Set to filter out duplicate titles more efficiently
		const uniquePrograms = Array.from(
			new Map(allPrograms.map((program) => [program.title, program])).values()
		);
		return NextResponse.json(uniquePrograms);
	} catch (error) {
		console.error('Error al obtener programas:', error);
		return NextResponse.json(
			{ error: 'Error al obtener programas' },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			programId: string;
			userIds: string[];
			planType: 'Pro' | 'Premium' | 'Enterprise';
		};

		const { programId, userIds, planType } = body;
		const parsedProgramId = Number(programId);

		if (isNaN(parsedProgramId)) {
			return NextResponse.json(
				{ error: 'programId inválido' },
				{ status: 400 }
			);
		}

		if (!Array.isArray(userIds) || userIds.some((id) => !id.trim())) {
			return NextResponse.json({ error: 'userIds inválidos' }, { status: 400 });
		}

		const existingUsers = await db
			.select({ id: users.id })
			.from(users)
			.where(inArray(users.id, userIds))
			.execute();

		const validUserIds = new Set(existingUsers.map((u) => u.id));
		const filteredUserIds = userIds.filter((id) => validUserIds.has(id));

		if (filteredUserIds.length === 0) {
			return NextResponse.json(
				{ error: 'Ninguno de los usuarios existe.' },
				{ status: 400 }
			);
		}

		const existingEnrollments = await db
			.select({ userId: enrollmentPrograms.userId })
			.from(enrollmentPrograms)
			.where(
				and(
					eq(enrollmentPrograms.programaId, parsedProgramId),
					inArray(enrollmentPrograms.userId, filteredUserIds)
				)
			)
			.execute();

		const existingUserIds = new Set(existingEnrollments.map((e) => e.userId));
		const newUsers = filteredUserIds.filter((id) => !existingUserIds.has(id));

		if (newUsers.length > 0) {
			const oneMonthFromNow = new Date();
			oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

			// Format date for Clerk
			const formattedDate =
				oneMonthFromNow.toISOString().slice(0, 10) + ' 23:59:59';

			// Update DB users
			await db
				.update(users)
				.set({
					subscriptionStatus: 'active',
					planType: planType,
					subscriptionEndDate: oneMonthFromNow,
				})
				.where(inArray(users.id, newUsers));

				const clerk = clerkClient;
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
				await db.insert(enrollmentPrograms).values(
					batch.map((userId) => ({
						userId,
						programaId: parsedProgramId,
						enrolledAt: new Date(),
						completed: false,
					}))
				);
			}
		}

		const message = `Se asignaron ${newUsers.length} estudiantes al programa. ${existingUserIds.size} ya estaban inscritos.`;

		return NextResponse.json({
			added: newUsers.length,
			alreadyEnrolled: existingUserIds.size,
			message,
		});
	} catch (error) {
		console.error('Error al asignar estudiantes a programa:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Error desconocido' },
			{ status: 500 }
		);
	}
}
