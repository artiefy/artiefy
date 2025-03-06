'use server';

import { Redis } from '@upstash/redis';
import { getRelatedActivities } from '~/server/actions/estudiantes/activities/getRelatedActivities';
import type { Activity, Question } from '~/types';
import { getUserActivityProgress } from './getUserActivityProgress';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const getActivityContent = async (
	lessonId: number,
	userId: string
): Promise<Activity[]> => {
	try {
		console.log(`Fetching related activities for lesson ${lessonId}`);
		const relatedActivities = await getRelatedActivities(lessonId);

		console.log('Related activities:', relatedActivities);

		if (relatedActivities.length === 0) {
			console.log(`No related activities found for lesson ${lessonId}`);
			return [];
		}

		const userProgress = await getUserActivityProgress(userId);

		const activitiesWithContent = await Promise.all(
			relatedActivities.map(async (activity) => {
				const questionTypes = ['VOF', 'OM', 'ACompletar'] as const;
				let allQuestions: Question[] = [];

				for (const type of questionTypes) {
					const contentKey = `activity:${activity.id}:questions${type}`;
					console.log(`Fetching ${type} questions with key: ${contentKey}`);

					try {
						const content = await redis.get(contentKey);
						if (content) {
							const parsedQuestions = (
								typeof content === 'string' ? JSON.parse(content) : content
							) as Omit<Question, 'type'>[];

							const questionsWithType = parsedQuestions.map(
								(q) =>
									({
										...q,
										type:
											type === 'VOF'
												? 'VOF'
												: type === 'OM'
													? 'OM'
													: 'COMPLETAR',
									}) as Question
							);

							allQuestions = [...allQuestions, ...questionsWithType];
						}
					} catch (error) {
						console.error(`Error fetching ${type} questions:`, error);
					}
				}

				const activityProgress = userProgress.find(
					(progress) => progress.activityId === activity.id
				);

				return {
					...activity,
					content: {
						questions: allQuestions,
					},
					isCompleted: activityProgress?.isCompleted ?? false,
					userProgress: activityProgress?.progress ?? 0,
					createdAt: activity.lastUpdated,
				} as Activity;
			})
		);

		const validActivities = activitiesWithContent.filter(
			(activity): activity is Activity => activity !== null
		);

		console.log('Final activities with content:', validActivities);
		return validActivities;
	} catch (error) {
		console.error('Error in getActivityContent:', error);
		throw error;
	}
};

export { getActivityContent };
