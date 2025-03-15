import { NextResponse } from 'next/server';

import { getCoursesByProgramId } from '~/server/actions/superAdmin/program/getCoursesByProgramId';

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
		const courses = await getCoursesByProgramId(id);
		if (!courses || courses.length === 0) {
			return NextResponse.json({ error: 'Courses not found' }, { status: 404 });
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
