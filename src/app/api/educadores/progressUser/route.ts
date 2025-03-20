import { type NextRequest } from 'next/server';

import { getUserProgressByCourseId } from '~/models/educatorsModels/lessonsModels';

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const courseId = searchParams.get('courseId');

	if (!courseId) {
		return new Response(JSON.stringify({ error: 'Missing courseId' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const lessonsProgress = await getUserProgressByCourseId(Number(courseId));
		return new Response(JSON.stringify(lessonsProgress), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error fetching user progress:', error);
		return new Response(
			JSON.stringify({ error: 'Error fetching user progress' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}
