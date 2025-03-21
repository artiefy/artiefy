import { db } from '~/server/db/index';
import { materias } from '~/server/db/schema';

export async function getSubjects() {
	try {
		const subjects = await db
			.select({
				id: materias.id,
				title: materias.title,
				description: materias.description,
			})
			.from(materias);
		console.log('Subjects from DB:', subjects); // Add console log to debug
		return subjects;
	} catch (error) {
		console.error('Error fetching subjects:', error);
		throw new Error('Error fetching subjects');
	}
}
