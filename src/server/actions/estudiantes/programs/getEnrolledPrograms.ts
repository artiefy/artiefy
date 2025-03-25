'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms } from '~/server/db/schema';

interface Program {
	id: number;
	title: string;
	coverImageKey: string | null;
	category: {
		name: string;
	} | null;
	rating: number;
}

export async function getEnrolledPrograms(): Promise<Program[]> {
	const user = await currentUser();

	if (!user?.id) {
		throw new Error('Usuario no autenticado');
	}

	const enrollments = await db.query.enrollmentPrograms.findMany({
		where: eq(enrollmentPrograms.userId, user.id),
		with: {
			programa: {
				with: {
					category: true,
				},
			},
		},
	});

	return enrollments.map((enrollment) => ({
		id: enrollment.programa.id,
		title: enrollment.programa.title,
		coverImageKey: enrollment.programa.coverImageKey,
		category: enrollment.programa.category
			? {
					name: enrollment.programa.category.name,
				}
			: null,
		rating: enrollment.programa.rating ?? 0,
	}));
}
