import { NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  activities,
  courses,
  enrollments,
  lessons,
  nivel,
  parametros,
  posts,
  scores,
  userActivitiesProgress,
  userLessonsProgress,
  users,
  userTimeTracking,
} from '~/server/db/schema';

export async function GET(
  _req: Request,
  context: { params: { courseId?: string; userId?: string } }
) {
  console.log(
    '➡️ Endpoint /api/super-admin/course/[courseId]/stats/[userId] llamado con:',
    { params: context.params }
  );
  // Instancia Redis
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  function isPromise<T>(val: unknown): val is Promise<T> {
    return !!val && typeof (val as { then?: unknown }).then === 'function';
  }

  let params: unknown = context.params;
  if (isPromise(params)) {
    params = await params;
  }
  const { courseId, userId } = params as { courseId?: string; userId?: string };

  if (!courseId || !userId) {
    console.error('❌ Faltan parámetros requeridos', { courseId, userId });
    return NextResponse.json(
      { error: 'Faltan parámetros requeridos', courseId, userId },
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
      console.warn('⚠️ El usuario no está inscrito en este curso', {
        courseId,
        userId,
      });
      // Aún así, devolvemos la info del curso y del usuario si existen
      // para que el frontend pueda mostrar algo
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
    console.log('👤 userInfo:', userInfo);

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

    // Traer datos del curso incluyendo la foto
    const courseInfoRaw = await db
      .select({
        title: courses.title,
        instructor: courses.instructor,
        createdAt: courses.createdAt,
        difficulty: nivel.name,
        coverImageKey: courses.coverImageKey,
      })
      .from(courses)
      .where(eq(courses.id, Number(courseId)))
      .leftJoin(nivel, eq(courses.nivelid, nivel.id))
      .limit(1);

    // Resolver el nombre del instructor a partir del ID
    let instructorName: string | undefined;
    const instructorId = courseInfoRaw[0]?.instructor;
    if (instructorId) {
      const instructorUser = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, instructorId))
        .limit(1);
      instructorName = instructorUser[0]?.name ?? undefined;
    }

    const courseInfo = courseInfoRaw.map((c) => ({
      ...c,
      instructor: instructorName ?? c.instructor,
    }));
    console.log('📚 courseInfo:', courseInfo);

    // 🔹 Obtener todas las lecciones del curso
    const lessonRows = await db
      .select({
        lessonId: userLessonsProgress.lessonId,
        title: activities.name,
        progress: userLessonsProgress.progress,
        isCompleted: userLessonsProgress.isCompleted,
        lastUpdated: userLessonsProgress.lastUpdated,
      })
      .from(userLessonsProgress)
      .leftJoin(activities, eq(userLessonsProgress.lessonId, activities.id))
      .where(eq(userLessonsProgress.userId, userId));

    const totalLessons = lessonRows;
    const completedLessons = lessonRows.filter((lesson) => lesson.isCompleted);

    // 🔹 Calcular porcentaje de progreso
    const progressPercentage =
      totalLessons.length > 0
        ? Math.round((completedLessons.length / totalLessons.length) * 100)
        : 0;

    // 🔹 Obtener progreso en actividades y notas por actividad, incluyendo la clase (lección) a la que pertenece
    const activityDetailsRaw = await db
      .select({
        activityId: userActivitiesProgress.activityId,
        name: activities.name,
        description: activities.description,
        isCompleted: userActivitiesProgress.isCompleted,
        score: scores.score,
        parentTitle: lessons.title,
      })
      .from(userActivitiesProgress)
      .leftJoin(
        activities,
        eq(userActivitiesProgress.activityId, activities.id)
      )
      .leftJoin(
        scores,
        and(eq(scores.userId, userId), eq(scores.categoryid, activities.id))
      )
      .leftJoin(lessons, eq(activities.lessonsId, lessons.id))
      .where(eq(userActivitiesProgress.userId, userId));
    console.log(
      '🟦 activityDetailsRaw:',
      JSON.stringify(activityDetailsRaw, null, 2)
    );

    // 🔹 Consultar Redis para cada actividad
    const activityDetails = await Promise.all(
      activityDetailsRaw.map(async (activity) => {
        const redisKey = `activity:${activity.activityId}:user:${userId}:submission`;
        const redisData = await redis.get(redisKey);
        // Type guard para asegurar que redisData tiene 'grade'
        const hasGrade = (data: unknown): data is { grade: number } => {
          return (
            typeof data === 'object' &&
            data !== null &&
            'grade' in data &&
            typeof (data as { grade?: unknown }).grade === 'number'
          );
        };
        // Si no hay parentTitle, intentar buscarlo manualmente
        let parentTitle = activity.parentTitle;
        if (!parentTitle || parentTitle === '—') {
          // Buscar la clase asociada a la actividad de forma typesafe
          // Se asume que activity puede tener lessonsId o lessons_id (number | undefined)
          const lessonsId: number | undefined =
            (activity as { lessonsId?: number }).lessonsId ??
            (activity as { lessons_id?: number }).lessons_id;
          if (lessonsId) {
            const lesson = await db
              .select({ title: lessons.title })
              .from(lessons)
              .where(eq(lessons.id, lessonsId))
              .limit(1);
            if (lesson && lesson[0] && lesson[0].title) {
              parentTitle = lesson[0].title;
            } else {
              console.warn(
                '⚠️ Actividad sin clase asociada (lessonsId no encontrado):',
                { activity, lessonsId }
              );
              parentTitle = '';
            }
          } else {
            console.warn(
              '⚠️ Actividad sin campo lessonsId/lessons_id:',
              activity
            );
            parentTitle = '';
          }
        }
        const result = {
          ...activity,
          score: hasGrade(redisData) ? redisData.grade : activity.score,
          parentTitle,
        };
        console.log('🟩 activityDetail result:', result);
        return result;
      })
    );

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

    // 🔹 Enviar la respuesta final con todos los datos completos
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
        lessonDetails: lessonRows,
        evaluationParameters: formattedEvaluationParameters,
      },
    });

    return NextResponse.json({
      success: true,
      enrolled: existingEnrollment.length > 0,
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
        lessonDetails: lessonRows,
        evaluationParameters: Array.isArray(evaluationParameters)
          ? evaluationParameters
          : [],
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
