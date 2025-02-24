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
	users,
	courses,
	dificultad,
} from '~/server/db/schema';

export async function GET(
	req: Request,
	context: { params: { courseId?: string; userId?: string } }
) {
	const { courseId, userId } = context.params;

	if (!courseId || !userId) {
		return NextResponse.json(
			{ error: 'Faltan parámetros requeridos' },
			{ status: 400 }
		);
	}

	try {
		// 🔹 Verificar si el usuario ya está inscrito en el curso
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

		// 🔹 Obtener lecciones del curso actual
		const courseLessons = await db
			.select({ lessonId: lessons.id })
			.from(lessons)
			.where(eq(lessons.courseId, Number(courseId)));

		const lessonIds = courseLessons.map((lesson) => lesson.lessonId);

		// 🔹 Obtener actividades del curso actual
		const courseActivities = await db
			.select({ activityId: userActivitiesProgress.activityId })
			.from(userActivitiesProgress)
			.where(eq(userActivitiesProgress.userId, userId));



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

		// 🔹 Obtener datos del curso
		const courseInfo = await db
			.select({
				title: courses.title,
				instructor: courses.instructor,
				createdAt: courses.createdAt,
				difficulty: dificultad.name,
			})
			.from(courses)
			.where(eq(courses.id, Number(courseId)))
			.leftJoin(dificultad, eq(courses.dificultadid, dificultad.id))
			.limit(1);

		// 🔹 Obtener progreso en lecciones
		const totalLessons = await db
			.select()
			.from(userLessonsProgress)
			.where(
				and(
					eq(userLessonsProgress.userId, userId),
					inArray(userLessonsProgress.lessonId, lessonIds)
				)
			);

		const completedLessons = totalLessons.filter(
			(lesson) => lesson.isCompleted
		);

		// 🔹 Calcular progreso
		const progressPercentage =
			totalLessons.length > 0
				? Math.round((completedLessons.length / totalLessons.length) * 100)
				: 0;

		// 🔹 Obtener progreso en actividades
		const totalActivities = await db
			.select()
			.from(userActivitiesProgress)
			.where(eq(userActivitiesProgress.userId, userId));

		const completedActivities = totalActivities.filter(
			(activity) => activity.isCompleted
		);

		// 🔹 Contar mensajes en foros
		const forumPosts = await db
			.select()
			.from(posts)
			.where(eq(posts.userId, userId));

		// 🔹 Obtener puntaje acumulado
		const userScoreResult = await db
			.select({ score: scores.score })
			.from(scores)
			.where(eq(scores.userId, userId))
			.limit(1);

		const userScore = userScoreResult.length > 0 ? userScoreResult[0].score : 0;

		// 🔹 Respuesta con todos los datos
		const response = {
			success: true,
			enrolled: true,
			user: userInfo[0] || {},
			course: courseInfo[0] || {},
			statistics: {
				totalLessons: totalLessons.length,
				completedLessons: completedLessons.length,
				progressPercentage,
				totalActivities: totalActivities.length,
				completedActivities: completedActivities.length,
				forumPosts: forumPosts.length,
				userScore,
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error(
			'Error obteniendo datos del curso:',
			(error as Error).message
		);

		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
