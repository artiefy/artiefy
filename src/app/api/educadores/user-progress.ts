import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserProgressByLessonId } from '~/models/educatorsModels/lessonsModels';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { courseId, userId } = req.query;

	if (!courseId || !userId) {
		return res.status(400).json({ error: 'Missing courseId or userId' });
	}

	try {
		const lessonsProgress = await getUserProgressByLessonId(
			Number(courseId),
			String(userId)
		);
		res.status(200).json(lessonsProgress);
	} catch (error) {
		console.error('Error fetching user progress:', error);
		res.status(500).json({ error: 'Error fetching user progress' });
	}
}
