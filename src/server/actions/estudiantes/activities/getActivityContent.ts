'use server';

import { Redis } from '@upstash/redis';
import { getRelatedActivities } from '~/server/actions/estudiantes/activities/getRelatedActivities';
import type { Activity, Question } from '~/types';
import { getUserActivityProgress } from './getUserActivityProgress';
import { unstable_cache } from 'next/cache';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const getActivityContent = unstable_cache(
	async (lessonId: number, userId: string): Promise<Activity[]> => {
		try {
			console.log(`Fetching related activities for lesson ${lessonId}`);
			const relatedActivities = await getRelatedActivities(lessonId);

			if (relatedActivities.length === 0) {
				console.log(`No related activities found for lesson ${lessonId}`);
				return [];
			}

			console.log(`Fetching user progress for user ${userId}`);
			const userProgress = await getUserActivityProgress(userId);

			const activitiesWithContent = await Promise.all(
				relatedActivities.map(async (activity) => {
					const contentKey = `activity:${activity.id}:questions`;
					console.log(
						`Fetching content for activity ${activity.id} with key ${contentKey}`
					);
					const activityContent = await redis.get(contentKey);

					if (!activityContent) {
						console.log(`No content found for activity ${activity.id}`);
						return null;
					}

					let parsedContent: Question[];

					if (typeof activityContent === 'string') {
						try {
							parsedContent = JSON.parse(activityContent) as Question[];
						} catch (error) {
							console.error(
								`Error parsing content for activity ${activity.id}:`,
								error
							);
							return null;
						}
					} else if (Array.isArray(activityContent)) {
						parsedContent = activityContent as Question[];
					} else {
						console.error(
							`Unexpected content format for activity ${activity.id}:`,
							activityContent
						);
						return null;
					}

					const activityProgress = userProgress.find(
						(progress) => progress.activityId === activity.id
					);

					return {
						...activity,
						content: {
							questions: parsedContent,
						},
						isCompleted: activityProgress?.isCompleted ?? false,
						userProgress: activityProgress?.progress ?? 0,
					} as Activity;
				})
			);

			const validActivities = activitiesWithContent.filter(
				(activity): activity is Activity => activity !== null
			);

			if (validActivities.length === 0) {
				console.log(`No valid activities found for lesson ${lessonId}`);
			} else {
				console.log(
					`Found ${validActivities.length} valid activities for lesson ${lessonId}`
				);
			}

			return validActivities;
		} catch (error) {
			console.error('Error fetching activity content:', error);
			return [];
		}
	},
	['lesson-activities'],
	{ revalidate: 3600 }
);

export { getActivityContent };
