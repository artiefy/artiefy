import { NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  activities,
  courses,
  enrollments,
  nivel,
  parametros,
  posts,
  scores,
  userActivitiesProgress,
  userLessonsProgress,
  users,
  userTimeTracking,
} from '~/server/db/schema';

interface ActivityDetail {
  activityId: number;
  name: string;
  description: string | null;
  isCompleted: boolean;
  score: number;
  parentTitle: string;
  parametroId: number;
  parametroNombre: string;
  parametroPorcentaje: number;
  actividadPorcentaje: number;
}

interface ParametroAcumulado {
  sumaNotas: number;
  sumaPesos: number;
  parametroPorcentaje: number;
}

export async function GET(
  _req: Request,
  context: { params: { courseId?: string; userId?: string } }
) {
  function isPromise<T>(val: unknown): val is Promise<T> {
    return !!val && typeof (val as { then?: unknown }).then === 'function';
  }

  let params: unknown = context.params;
  if (isPromise(params)) {
    params = await params;
  }
  const { courseId, userId } = params as { courseId?: string; userId?: string };

  if (!courseId || !userId) {
    return NextResponse.json(
      { error: 'Faltan parámetros requeridos', courseId, userId },
      { status: 400 }
    );
  }

  const courseIdNum = Number(courseId);

  try {
    const existingEnrollment = await db
      .select({ enrolledAt: enrollments.enrolledAt })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, courseIdNum),
          eq(enrollments.userId, userId)
        )
      )
      .limit(1);

    const userInfo = await db
      .select({ firstName: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const evaluationParameters = await db
      .select({
        id: parametros.id,
        name: parametros.name,
        description: parametros.description,
        percentage: parametros.porcentaje,
        courseId: parametros.courseId,
      })
      .from(parametros)
      .where(eq(parametros.courseId, courseIdNum));

    const courseInfoRaw = await db
      .select({
        title: courses.title,
        instructor: courses.instructor,
        createdAt: courses.createdAt,
        difficulty: nivel.name,
        coverImageKey: courses.coverImageKey,
      })
      .from(courses)
      .where(eq(courses.id, courseIdNum))
      .leftJoin(nivel, eq(courses.nivelid, nivel.id))
      .limit(1);

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
    const completedLessons = lessonRows.filter((l) => l.isCompleted);
    const progressPercentage =
      totalLessons.length > 0
        ? Math.round((completedLessons.length / totalLessons.length) * 100)
        : 0;

    const activityDetailsRaw = await db
      .select({
        activityId: activities.id,
        name: activities.name,
        description: activities.description,
        parametroId: parametros.id,
        parametroNombre: parametros.name,
        parametroPorcentaje: parametros.porcentaje,
        actividadPorcentaje: activities.porcentaje,
        score: userActivitiesProgress.finalGrade,
        isCompleted: userActivitiesProgress.isCompleted,
      })
      .from(activities)
      .innerJoin(parametros, eq(activities.parametroId, parametros.id))
      .leftJoin(
        userActivitiesProgress,
        and(
          eq(userActivitiesProgress.activityId, activities.id),
          eq(userActivitiesProgress.userId, userId)
        )
      )
      .where(eq(parametros.courseId, courseIdNum));

    const activityDetails: ActivityDetail[] = activityDetailsRaw.map((a) => ({
      activityId: a.activityId,
      name: a.name,
      description: a.description,
      isCompleted: a.isCompleted ?? false,
      score: a.score ?? 0,
      parentTitle: a.parametroNombre,
      parametroId: a.parametroId,
      parametroNombre: a.parametroNombre,
      parametroPorcentaje: a.parametroPorcentaje,
      actividadPorcentaje: a.actividadPorcentaje ?? 0,
    }));

    const totalActivities = activityDetails.length;
    const completedActivities = activityDetails.filter(
      (a) => a.isCompleted
    ).length;

    const forumPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId));

    const userScoreResult = await db
      .select({ score: scores.score })
      .from(scores)
      .where(eq(scores.userId, userId))
      .limit(1);
    const userScore = userScoreResult.length > 0 ? userScoreResult[0].score : 0;

    const totalTimeSpent = await db
      .select({ timeSpent: userTimeTracking.timeSpent })
      .from(userTimeTracking)
      .where(eq(userTimeTracking.userId, userId));
    const totalTime = totalTimeSpent.reduce(
      (acc, t) => acc + (t.timeSpent || 0),
      0
    );

    const porParametro: Map<number, ParametroAcumulado> = new Map();

    activityDetails.forEach((a) => {
      const entry: ParametroAcumulado = porParametro.get(a.parametroId) ?? {
        sumaNotas: 0,
        sumaPesos: 0,
        parametroPorcentaje: a.parametroPorcentaje,
      };
      entry.sumaNotas += a.score * (a.actividadPorcentaje / 100);
      entry.sumaPesos += a.actividadPorcentaje / 100;
      porParametro.set(a.parametroId, entry);
    });

    let sumaFinal = 0;
    let sumaPesosFinal = 0;
    porParametro.forEach(({ sumaNotas, sumaPesos, parametroPorcentaje }) => {
      const promedioParametro = sumaPesos > 0 ? sumaNotas / sumaPesos : 0;
      sumaFinal += promedioParametro * (parametroPorcentaje / 100);
      sumaPesosFinal += parametroPorcentaje / 100;
    });

    const globalCourseScore =
      sumaPesosFinal > 0 ? (sumaFinal / sumaPesosFinal).toFixed(2) : '0.00';

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
        evaluationParameters,
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
