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
	activities,
	userTimeTracking, // 🔹 Se agregó para corregir error
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

		// 🔹 Obtener lecciones del curso
		const courseLessons = await db
			.select({ lessonId: lessons.id })
			.from(lessons)
			.where(eq(lessons.courseId, Number(courseId)));

		const lessonIds = courseLessons.map((lesson) => lesson.lessonId);

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
	.leftJoin(activities, eq(userActivitiesProgress.activityId, activities.id))
	.leftJoin(scores, and(eq(scores.userId, userId), eq(userActivitiesProgress.activityId, activities.id))) // 👈 Corrección en la relación
	.where(eq(userActivitiesProgress.userId, userId));

console.log('🔍 Detalles de actividades:', activityDetails);


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

		// Obtener progreso en lecciones (añadiendo el progreso real de cada lección)
			const lessonProgress = await db
			.select({
				lessonId: userLessonsProgress.lessonId,
				progress: userLessonsProgress.progress,
				isCompleted: userLessonsProgress.isCompleted,
			})
			.from(userLessonsProgress)
			.where(eq(userLessonsProgress.userId, userId));
			// Obtener progreso en lecciones (con detalles de cada lección)
			const lessonDetails = await db
			.select({
				lessonId: userLessonsProgress.lessonId,
				title: lessons.title, // ✅ Título de la lección
				progress: userLessonsProgress.progress,
				isCompleted: userLessonsProgress.isCompleted,
				lastUpdated: userLessonsProgress.lastUpdated,
			})
			.from(userLessonsProgress)
			.leftJoin(lessons, eq(userLessonsProgress.lessonId, lessons.id)) // ✅ Relaciona con lecciones
			.where(eq(userLessonsProgress.userId, userId));


			const totalLessonProgress = lessonProgress.reduce(
				(sum, lesson) => sum + (lesson.progress ?? 0),
				0
			);
			
			const averageLessonProgress =
				lessonProgress.length > 0
					? Number((totalLessonProgress / lessonProgress.length).toFixed(2))
					: 0;
			
			console.log('📊 averageLessonProgress:', averageLessonProgress); // <-- Verifica que no sea undefined
			


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

		// 🔹 Responder con todos los datos
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
				totalTimeSpent: totalTime, // Tiempo total en minutos
				globalCourseScore, // Nota global del curso basada en actividades
				activities: activityDetails, // Detalle de actividades con notas
				averageLessonProgress,
				lessonDetails, 
			},
		});
	} catch (error) {
		console.error('Error obteniendo datos del curso:', error);
		return NextResponse.json(
			{ error: 'Error interno del servidor' },
			{ status: 500 }
		);
	}
}
