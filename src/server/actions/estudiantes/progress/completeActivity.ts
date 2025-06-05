'use server';

import { currentUser } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { eq, sql } from 'drizzle-orm';

import { createNotification } from '~/server/actions/notifications/createNotification';
import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

import type { ActivityResults } from '~/types';

// Update DbQueryResult interface to extend Record<string, unknown>
interface DbQueryResult extends Record<string, unknown> {
  rows: {
    [key: string]: unknown;
    final_grade: number | null;
  }[];
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const completeActivity = async (activityId: number, userId: string) => {
  try {
    // Verificar usuario autenticado
    const user = await currentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // 1. Obtener actividad y sus detalles
    const activity = await db.query.activities.findFirst({
      where: (activities, { eq }) => eq(activities.id, activityId),
      with: {
        parametro: true,
        lesson: {
          with: {
            course: true,
          },
        },
      },
    });

    if (!activity) {
      throw new Error('Actividad no encontrada');
    }

    // 2. Obtener resultados de Redis
    const resultsKey = `activity:${activityId}:user:${userId}:results`;
    const rawData = await redis.get<ActivityResults>(resultsKey);

    if (!rawData) {
      // Verificar si ya está completada en la base de datos
      const existingProgress = await db.query.userActivitiesProgress.findFirst({
        where: (progress) =>
          eq(progress.activityId, activityId) && eq(progress.userId, userId),
      });

      if (existingProgress?.isCompleted) {
        return { success: true, message: 'Actividad ya completada' };
      }

      throw new Error('No se encontraron resultados de la actividad');
    }

    // 3. Actualizar progreso de actividad
    const activityProgress = {
      userId,
      activityId,
      progress: 100,
      isCompleted: true,
      lastUpdated: new Date(),
      revisada: activity.revisada,
      attemptCount: rawData.attemptCount ?? 1,
      finalGrade: rawData.finalGrade,
      lastAttemptAt: new Date(),
    };

    await db
      .insert(userActivitiesProgress)
      .values(activityProgress)
      .onConflictDoUpdate({
        target: [
          userActivitiesProgress.userId,
          userActivitiesProgress.activityId,
        ],
        set: activityProgress,
      });

    // 4. Si hay parámetro asociado, actualizar notas
    if (activity.parametroId) {
      // Update parameter grades using raw SQL
      await db.execute(sql`
				INSERT INTO parameter_grades (parameter_id, user_id, grade, updated_at)
				VALUES (${activity.parametroId}, ${userId}, ${rawData.finalGrade}, NOW())
				ON CONFLICT (parameter_id, user_id) 
				DO UPDATE SET grade = ${rawData.finalGrade}, updated_at = NOW()
			`);

      // Handle materia grades if there's a course
      if (activity.lesson?.course?.id) {
        await db.execute(sql`
					WITH course_materias AS (
						SELECT id FROM materias WHERE courseid = ${activity.lesson.course.id}
					)
					INSERT INTO materia_grades (materia_id, user_id, grade, updated_at)
					SELECT id, ${userId}, ${rawData.finalGrade}, NOW()
					FROM course_materias
					ON CONFLICT (materia_id, user_id) 
					DO UPDATE SET grade = EXCLUDED.grade, updated_at = EXCLUDED.updated_at
				`);
      }
    }

    // Update parameter grades and materia grades
    if (activity.parametroId && rawData?.finalGrade) {
      // Get current course final grade with proper typing
      const gradeSummary = await db.execute<DbQueryResult>(sql`
				WITH parameter_grades AS (
					SELECT 
						p.id,
						p.porcentaje as weight,
						ROUND(CAST(AVG(uap.final_grade) AS NUMERIC), 1) as grade
					FROM parametros p
					LEFT JOIN activities a ON a.parametro_id = p.id
					LEFT JOIN user_activities_progress uap ON uap.activity_id = a.id 
						AND uap.user_id = ${userId}
					WHERE p.course_id = ${activity.lesson.courseId}
					GROUP BY p.id, p.porcentaje
				)
				SELECT ROUND(CAST(SUM(grade * weight / 100) AS NUMERIC), 1) as final_grade
				FROM parameter_grades
			`);

      const currentFinalGrade = Number(
        gradeSummary.rows[0]?.final_grade ?? rawData.finalGrade
      );
      console.log('Course final grade:', currentFinalGrade);

      // Update materia grades with course final grade
      if (activity.lesson?.course?.id) {
        await db.execute(sql`
					WITH course_materias AS (
						SELECT id FROM materias WHERE courseid = ${activity.lesson.course.id}
					)
					INSERT INTO materia_grades (materia_id, user_id, grade, updated_at)
					SELECT id, ${userId}, ${currentFinalGrade}, NOW()
					FROM course_materias
					ON CONFLICT (materia_id, user_id) 
					DO UPDATE SET grade = EXCLUDED.grade, updated_at = EXCLUDED.updated_at
				`);
      }

      // Create notification with properly formatted grade
      await createNotification({
        userId,
        type: 'ACTIVITY_COMPLETED',
        title: '¡Actividad completada!',
        message: `Has completado la actividad con una calificación de ${currentFinalGrade.toFixed(1)}%`,
        metadata: {
          lessonId: activity.lessonsId,
          courseId: activity.lesson?.courseId,
          activityId: activity.id,
        },
      });
    } else {
      // If no parameter grade, use the raw data final grade (ensure it's a number)
      const finalGrade = Number(rawData.finalGrade);
      await createNotification({
        userId,
        type: 'ACTIVITY_COMPLETED',
        title: '¡Actividad completada!',
        message: `Has completado la actividad con una calificación de ${finalGrade.toFixed(1)}%`,
        metadata: {
          lessonId: activity.lessonsId,
          courseId: activity.lesson?.courseId,
          activityId: activity.id,
        },
      });
    }

    return { success: true, message: 'Actividad completada exitosamente' };
  } catch (error) {
    console.error('Error completing activity:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Error al completar la actividad',
    };
  }
};
