import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';
import { formatScoreNumber } from '~/utils/formatScore';

import type { SavedAnswer, ActivityResults } from '~/types';

interface SaveAnswersRequest {
	activityId: number;
	userId: string;
	answers: Record<string, SavedAnswer>;
	score: number;
	allQuestionsAnswered: boolean;
}

interface ActivityData {
	revisada: boolean;
	id: number;
	parametroId: number | null;
}

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
	try {
		const data = (await request.json()) as SaveAnswersRequest;
		const { activityId, userId, answers } = data;

		// Get activity and its details
		const activityKey = `activity:${activityId}`;
		const activity = await redis.get<ActivityData>(activityKey);

		const currentProgress = await db.query.userActivitiesProgress.findFirst({
			where: and(
				eq(userActivitiesProgress.userId, userId),
				eq(userActivitiesProgress.activityId, activityId)
			),
		});

		const currentAttempts = currentProgress?.attemptCount ?? 0;

		// Verify attempts limit ONLY for revisada activities
		if (activity?.revisada && currentAttempts >= 3) {
			return NextResponse.json(
				{
					success: false,
					canClose: true,
					message: 'Has alcanzado el límite de intentos',
					attemptsExhausted: true,
					finalGrade: currentProgress?.finalGrade ?? 0,
				},
				{ status: 403 }
			);
		}

		// Calculate score
		const weightedScore = calculateWeightedScore(answers);
		const passed = weightedScore >= 3;

		// Prepare results for Redis
		const results: ActivityResults = {
			answers,
			score: weightedScore,
			passed,
			submittedAt: new Date().toISOString(),
			attemptCount: currentAttempts + 1,
			finalGrade: weightedScore,
			parameterId: activity?.parametroId ?? undefined,
			revisada: activity?.revisada,
		};

		// Always save results to Redis regardless of activity type or attempts
		const resultsKey = `activity:${activityId}:user:${userId}:results`;
		await redis.set(resultsKey, results);

		// For non-revisada activities, only check if passed
		if (!activity?.revisada) {
			// Allow infinite attempts
			const newAttemptCount = currentAttempts + 1;
			await db
				.insert(userActivitiesProgress)
				.values({
					userId,
					activityId,
					progress: 100,
					isCompleted: passed, // Set isCompleted based on passing score
					lastUpdated: new Date(),
					revisada: false,
					attemptCount: newAttemptCount,
					finalGrade: weightedScore,
					lastAttemptAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [
						userActivitiesProgress.userId,
						userActivitiesProgress.activityId,
					],
					set: {
						finalGrade: weightedScore,
						attemptCount: newAttemptCount,
						lastAttemptAt: new Date(),
						isCompleted: passed, // Update isCompleted status
						revisada: false,
					},
				});

			return NextResponse.json({
				success: false,
				canClose: false,
				message: 'Puedes seguir intentando hasta aprobar',
				score: weightedScore,
				attemptCount: newAttemptCount,
			});
		}

		// For revisada activities with exhausted attempts
		if (activity.revisada && currentAttempts >= 2) {
			// Check for last attempt (3rd attempt)
			await db
				.insert(userActivitiesProgress)
				.values({
					userId,
					activityId,
					progress: 100,
					isCompleted: true, // Mark as completed on last attempt
					lastUpdated: new Date(),
					revisada: true,
					attemptCount: currentAttempts + 1,
					finalGrade: weightedScore,
					lastAttemptAt: new Date(),
				})
				.onConflictDoUpdate({
					target: [
						userActivitiesProgress.userId,
						userActivitiesProgress.activityId,
					],
					set: {
						finalGrade: weightedScore,
						attemptCount: currentAttempts + 1,
						lastAttemptAt: new Date(),
						isCompleted: true, // Force completed on last attempt
						revisada: true,
					},
				});

			return NextResponse.json({
				success: true,
				canClose: true,
				message: 'Último intento completado',
				score: weightedScore,
				attemptsRemaining: 0,
				attemptCount: currentAttempts + 1,
			});
		}

		// Regular revisada activity attempt
		await db
			.insert(userActivitiesProgress)
			.values({
				userId,
				activityId,
				progress: 100,
				isCompleted: passed,
				lastUpdated: new Date(),
				revisada: true,
				attemptCount: currentAttempts + 1,
				finalGrade: weightedScore,
				lastAttemptAt: new Date(),
			})
			.onConflictDoUpdate({
				target: [
					userActivitiesProgress.userId,
					userActivitiesProgress.activityId,
				],
				set: {
					finalGrade: weightedScore,
					attemptCount: currentAttempts + 1,
					lastAttemptAt: new Date(),
					isCompleted: passed,
					revisada: true,
				},
			});

		return NextResponse.json({
			success: passed || !activity?.revisada,
			canClose: passed || !activity?.revisada,
			message: passed
				? 'Actividad completada correctamente'
				: activity?.revisada
					? `Intento ${currentAttempts + 1}/3 completado`
					: 'Actividad guardada',
			score: weightedScore,
			attemptsRemaining: activity?.revisada ? 3 - (currentAttempts + 1) : null,
			attemptCount: currentAttempts + 1,
		});
	} catch (error) {
		console.error('Error saving answers:', error);
		return NextResponse.json(
			{ success: false, error: 'Error al guardar las respuestas' },
			{ status: 500 }
		);
	}
}

function calculateWeightedScore(answers: Record<string, SavedAnswer>): number {
	let totalWeight = 0;
	let weightedSum = 0;

	Object.values(answers).forEach((answer) => {
		const weight = answer.pesoPregunta ?? 1;
		totalWeight += weight;
		weightedSum += answer.isCorrect ? weight : 0;
	});

	return formatScoreNumber((weightedSum / totalWeight) * 5);
}
