'use server';

import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { preferences } from '~/server/db/schema';

// Guardar preferencias del usuario
export async function savePreferences(
	userId: string,
	categoryIds: number[]
): Promise<void> {
	await db.delete(preferences).where(eq(preferences.userId, userId));
	await db.insert(preferences).values(
		categoryIds.map((categoryId) => ({
			userId,
			categoryid: categoryId,
			name: '',
		}))
	);
}
