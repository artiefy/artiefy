import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import {
	enrollments,
	userLessonsProgress,
	userActivitiesProgress,
	posts,
	scores,
	lessons,
} from '~/server/db/schema';

export async function GET(
	req: Request,
	{ params }: { params: { courseId: string; userId: string } }
) {
	const { courseId, userId } = params;

	// Validar los parámetros
	if (!courseId || !userId) {
		return NextResponse.json(
			{ error: 'Faltan parámetros requeridos' },
			{ status: 400 }
		);
	}

	try {
		// Verificar si el usuario está inscrito en el curso
		const userEnrollment = await db
			.select()
			.from(enrollments)
			.where(
				and(
					eq(enrollments.courseId, Number(courseId)),
					eq(enrollments.userId, userId)
				)
			)
			.limit(1);

		if (userEnrollment.length === 0) {
			return NextResponse.json(
				{ error: 'El usuario no está inscrito en este curso' },
				{ status: 404 }
			);
		}

		// 🔹 Obtener todas las lecciones del curso
		const courseLessons = await db
			.select({ lessonId: lessons.id })
			.from(lessons)
			.where(eq(lessons.courseId, Number(courseId)));

		const lessonIds = courseLessons.map((lesson) => lesson.lessonId);

		// 🔹 Obtener lecciones totales y completadas del usuario
		const totalLessons = await db
			.select()
			.from(userLessonsProgress)
			.where(
				and(
					eq(userLessonsProgress.userId, userId),
					inArray(userLessonsProgress.lessonId, lessonIds)
				)
			);

		const completedLessons = await db
			.select()
			.from(userLessonsProgress)
			.where(
				and(
					eq(userLessonsProgress.userId, userId),
					inArray(userLessonsProgress.lessonId, lessonIds),
					eq(userLessonsProgress.isCompleted, true)
				)
			);

		// 🔹 Calcular porcentaje de progreso
		const progressPercentage =
			totalLessons.length > 0
				? Math.round((completedLessons.length / totalLessons.length) * 100)
				: 0;

		// 🔹 Obtener actividades totales y completadas
		const totalActivities = await db
			.select()
			.from(userActivitiesProgress)
			.where(eq(userActivitiesProgress.userId, userId));

		const completedActivities = await db
			.select()
			.from(userActivitiesProgress)
			.where(
				and(
					eq(userActivitiesProgress.userId, userId),
					eq(userActivitiesProgress.isCompleted, true)
				)
			);

		// 🔹 Contar mensajes en foros del curso
		const forumPosts = await db
			.select()
			.from(posts)
			.where(eq(posts.userId, userId));

		// 🔹 Obtener puntaje acumulado en el curso
		const userScoreResult = await db
			.select({ score: scores.score })
			.from(scores)
			.where(eq(scores.userId, userId))
			.limit(1);

		const userScore = userScoreResult.length > 0 ? userScoreResult[0].score : 0;

		// 🔹 Responder con estadísticas
		return NextResponse.json({
			success: true,
			enrolled: true,
			totalLessons: totalLessons.length,
			completedLessons: completedLessons.length,
			progressPercentage,
			totalActivities: totalActivities.length,
			completedActivities: completedActivities.length,
			forumPosts: forumPosts.length,
			userScore,
		});
	} catch (error) {
		// Manejo seguro del error
		const err = error as Error;
		console.error('Error obteniendo datos del curso:', err.message);

		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
