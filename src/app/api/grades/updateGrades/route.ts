import { type NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '~/server/db';
import {
  userActivitiesProgress,
  materiaGrades,
  parameterGrades,
  materias,
} from '~/server/db/schema';

interface RequestData {
  courseId: number;
  userId: string;
  activityId: number;
  finalGrade: number;
}

interface ParameterData {
  sum: number;
  count: number;
  weight: number;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as RequestData;
    const { courseId, userId, activityId, finalGrade } = data;

    // 1. Update activity progress in database
    await db
      .insert(userActivitiesProgress)
      .values({
        userId,
        activityId,
        progress: 100,
        isCompleted: true,
        finalGrade,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          userActivitiesProgress.userId,
          userActivitiesProgress.activityId,
        ],
        set: {
          finalGrade,
          lastUpdated: new Date(),
        },
      });

    // 2. Calculate parameter grades
    const courseActivities = await db.query.activities.findMany({
      where: (activities) => and(eq(activities.lessonsId, courseId)),
      with: {
        parametro: true,
      },
    });

    const parameterGradesMap = new Map<number, ParameterData>();
    for (const activity of courseActivities) {
      if (!activity.parametroId) continue;

      const progress = await db.query.userActivitiesProgress.findFirst({
        where: (uap) =>
          and(eq(uap.activityId, activity.id), eq(uap.userId, userId)),
      });

      if (progress?.finalGrade) {
        const current = parameterGradesMap.get(activity.parametroId) ?? {
          sum: 0,
          count: 0,
          weight: activity.parametro?.porcentaje ?? 0,
        };
        current.sum += progress.finalGrade;
        current.count++;
        parameterGradesMap.set(activity.parametroId, current);
      }
    }

    // 3. Calculate and save final course grade
    let totalWeightedGrade = 0;
    let totalWeight = 0;

    for (const [parameterId, data] of parameterGradesMap.entries()) {
      const parameterGrade = data.sum / data.count;
      totalWeightedGrade += parameterGrade * data.weight;
      totalWeight += data.weight;

      // Save parameter grade
      await db
        .insert(parameterGrades)
        .values({
          parameterId,
          userId,
          grade: parameterGrade,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [parameterGrades.parameterId, parameterGrades.userId],
          set: { grade: parameterGrade, updatedAt: new Date() },
        });
    }

    const finalCourseGrade = totalWeightedGrade / totalWeight;

    // 4. Update grades for all materias associated with this course
    const courseMaterias = await db.query.materias.findMany({
      where: eq(materias.courseid, courseId),
    });

    for (const materia of courseMaterias) {
      await db
        .insert(materiaGrades)
        .values({
          materiaId: materia.id,
          userId,
          grade: finalCourseGrade,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [materiaGrades.materiaId, materiaGrades.userId],
          set: { grade: finalCourseGrade, updatedAt: new Date() },
        });
    }

    return NextResponse.json({
      success: true,
      finalGrade: finalCourseGrade,
      parameterGrades: Object.fromEntries(parameterGradesMap),
    });
  } catch (error) {
    console.error('Error updating grades:', error);
    return NextResponse.json(
      { success: false, error: 'Error updating grades' },
      { status: 500 }
    );
  }
}
