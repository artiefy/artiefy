import { NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
	enrollments,
	userLessonsProgress,
	userActivitiesProgress,
	posts,
	scores,
	users,
	courses,
	nivel,
	activities,
	userTimeTracking,
	parametros,
} from '~/server/db/schema';

export async function GET(
	_req: Request,
	context: { params: { courseId?: string; userId?: string } }
) {
	const courseId = context?.params?.courseId;
	const userId = context?.params?.userId;

	if (!courseId || !userId) {
		return NextResponse.json(
			{ error: 'Faltan parámetros requeridos' },
			{ status: 400 }
		);
	}

	try {
		// 🔹 Verificar si el usuario está inscrito en el curso
		const existingEnrollment = await db
			.select({ enrolledAt: enrollments.enrolledAt })
			.from(enrollments)
			.where(
				and(
					eq(enrollments.courseId, Number(courseId)),
					eq(enrollments.userId, userId)
				)
			)
			.limit(1);

		if (existingEnrollment.length === 0) {
			return NextResponse.json(
				{ error: 'El usuario no está inscrito en este curso' },
				{ status: 404 }
			);
		}

		// 🔹 Obtener datos del usuario
		const userInfo = await db
			.select({
				firstName: users.name,
				email: users.email,
				role: users.role,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		// 🔹 Obtener los parámetros de evaluación del curso
		const evaluationParameters = await db
			.select({
				id: parametros.id,
				name: parametros.name,
				description: parametros.description,
				percentage: parametros.porcentaje,
				courseId: parametros.courseId,
			})
			.from(parametros)
			.where(eq(parametros.courseId, Number(courseId)));

		// 🔹 Asegurar que `evaluationParameters` sea un array
		const formattedEvaluationParameters = Array.isArray(evaluationParameters)
			? evaluationParameters
			: [];

		console.log(
			'📊 Parámetros de Evaluación obtenidos:',
			formattedEvaluationParameters
		);

		const courseInfo = await db
			.select({
				title: courses.title,
				instructor: courses.instructor,
				createdAt: courses.createdAt,
				difficulty: nivel.name,
			})
			.from(courses)
			.where(eq(courses.id, Number(courseId)))
			.leftJoin(nivel, eq(courses.nivelid, nivel.id))
			.limit(1);

		// 🔹 Obtener progreso en lecciones
		const totalLessons = await db
			.select()
			.from(userLessonsProgress)
			.where(eq(userLessonsProgress.userId, userId));

		const completedLessons = totalLessons.filter(
			(lesson) => lesson.isCompleted
		);

		// 🔹 Calcular porcentaje de progreso
		const progressPercentage =
			totalLessons.length > 0
				? Math.round((completedLessons.length / totalLessons.length) * 100)
				: 0;

		// 🔹 Obtener progreso en actividades
		const activityDetails = await db
			.select({
				activityId: userActivitiesProgress.activityId,
				name: activities.name,
				description: activities.description,
				isCompleted: userActivitiesProgress.isCompleted,
				score: scores.score || 0,
			})
			.from(userActivitiesProgress)
			.leftJoin(
				activities,
				eq(userActivitiesProgress.activityId, activities.id)
			)
			.leftJoin(
				scores,
				and(
					eq(scores.userId, userId),
					eq(userActivitiesProgress.activityId, activities.id)
				)
			)
			.where(eq(userActivitiesProgress.userId, userId));

		const totalActivities = activityDetails.length;
		const completedActivities = activityDetails.filter(
			(a) => a.isCompleted
		).length;

		// 🔹 Contar mensajes en foros
		const forumPosts = await db
			.select()
			.from(posts)
			.where(eq(posts.userId, userId));

		// 🔹 Obtener puntaje total del usuario
		const userScoreResult = await db
			.select({ score: scores.score })
			.from(scores)
			.where(eq(scores.userId, userId))
			.limit(1);

		const userScore = userScoreResult.length > 0 ? userScoreResult[0].score : 0;

		// 🔹 Obtener tiempo total invertido en la plataforma
		const totalTimeSpent = await db
			.select({ timeSpent: userTimeTracking.timeSpent })
			.from(userTimeTracking)
			.where(eq(userTimeTracking.userId, userId));

		const totalTime = totalTimeSpent.reduce(
			(acc, time) => acc + (time.timeSpent || 0),
			0
		);

		// 🔹 Calcular nota global del curso basada en actividades
		const totalActivityScore = activityDetails.reduce(
			(sum, activity) => sum + (activity.score ?? 0),
			0
		);
		const globalCourseScore =
			totalActivities > 0
				? (totalActivityScore / totalActivities).toFixed(2)
				: '0.00';

		// 🔹 Enviar la respuesta final con los parámetros corregidos
		console.log('📊 Enviando respuesta final:', {
			success: true,
			enrolled: true,
			user: userInfo[0] || {},
			course: courseInfo[0] || {},
			statistics: {
				totalLessons: totalLessons.length,
				completedLessons: completedLessons.length,
				progressPercentage,
				totalActivities,
				completedActivities,
				forumPosts: forumPosts.length,
				userScore,
				totalTimeSpent: totalTime,
				globalCourseScore,
				activities: activityDetails,
				evaluationParameters: formattedEvaluationParameters, // ✅ Se asegura que es un array
			},
		});

		return NextResponse.json({
			success: true,
			enrolled: true,
			user: userInfo[0] || {},
			course: courseInfo[0] || {},
			statistics: {
				totalLessons: totalLessons.length,
				completedLessons: completedLessons.length,
				progressPercentage,
				totalActivities,
				completedActivities,
				forumPosts: forumPosts.length,
				userScore,
				totalTimeSpent: totalTime,
				globalCourseScore,
				activities: activityDetails,
				evaluationParameters: Array.isArray(evaluationParameters) ? evaluationParameters : [], // ✅ Enviar como array válido
			},
		});
		
	} catch (error) {
		console.error('❌ Error obteniendo datos del curso:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
