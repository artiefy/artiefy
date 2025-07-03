/* 'use server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectsTaken } from '~/server/db/schema';

import type { ProjectTaken } from '~/types';

// Obtener proyectos tomados por el usuario
export async function getUserProjectsTaken(
	userId: string
): Promise<ProjectTaken[]> {
	return db.query.projectsTaken.findMany({
		where: eq(projectsTaken.userId, userId),
		with: {
			project: true,
		},
	});
}
 */