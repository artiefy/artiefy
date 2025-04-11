import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { materias, courses } from '~/server/db/schema';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const programId = searchParams.get('programId');

	try {
		if (programId) {
			const results = await db
				.select({
					id: courses.id,
					title: courses.title,
				})
				.from(materias)
				.innerJoin(courses, eq(materias.courseid, courses.id))
				.where(eq(materias.programaId, Number(programId)));

			return NextResponse.json(results);
		} else {
			// Return all courses if no programId is provided
			const allCourses = await db
				.select({
					id: courses.id,
					title: courses.title,
				})
				.from(courses);

			return NextResponse.json(allCourses);
		}
	} catch (error) {
		console.error('Error fetching courses:', error);
		return NextResponse.json(
			{ error: 'Error fetching courses' },
			{ status: 500 }
		);
	}
}
