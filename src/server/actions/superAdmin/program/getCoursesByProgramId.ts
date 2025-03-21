import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { courses, materias } from '~/server/db/schema';

export async function getCoursesByProgramId(programId: string) {
	try {
		const result = await db
			.selectDistinct({
				id: courses.id,
				title: courses.title,
				description: courses.description,
				coverImageKey: courses.coverImageKey,
				categoryid: courses.categoryid,
				instructor: courses.instructor,
				modalidadesid: courses.modalidadesid,
				nivelid: courses.nivelid,
				rating: courses.rating,
			})
			.from(courses)
			.innerJoin(materias, eq(materias.programaId, parseInt(programId)))
			.where(eq(courses.id, materias.courseid));
		return result;
	} catch (error) {
		console.error('Error fetching courses:', error);
		return [];
	}
}
