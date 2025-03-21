import { NextResponse } from 'next/server';

import { getCoursesByProgramId } from '~/server/actions/superAdmin/program/getCoursesByProgramId';

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const id = params.id; // Correctly accessing 'id'
		const courses = await getCoursesByProgramId(id);
		// Change here: Return empty array instead of 404 when no courses found
		if (!courses || courses.length === 0) {
			return NextResponse.json([]); // Returning an empty array
		}
		return NextResponse.json(courses);
	} catch (error) {
		console.error('Error fetching courses:', error);
		return NextResponse.json(
			{ error: 'Error fetching courses' },
			{ status: 500 }
		);
	}
}
