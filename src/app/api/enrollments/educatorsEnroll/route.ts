import { NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  enrollments,
  lessons,
  userLessonsProgress,
  users,
} from '~/server/db/schema';
import { sortLessons } from '~/utils/lessonSorting';

interface EnrollmentRequestBody {
  courseId: string | number;
  userIds: string[];
  planType?: string;
}

function formatDateToClerk(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EnrollmentRequestBody;
    const { courseId, userIds, planType } = body;

    if (
      (typeof courseId !== 'string' && typeof courseId !== 'number') ||
      !Array.isArray(userIds) ||
      userIds.some((id) => typeof id !== 'string')
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const parsedCourseId = Number(courseId);
    if (isNaN(parsedCourseId)) {
      return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
    }

    if (
      !courseId ||
      !userIds ||
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const validPlans = ['Pro', 'Premium', 'Enterprise'] as const;
    type ValidPlan = (typeof validPlans)[number];
    type PlanType = ValidPlan | 'none';

    const normalizedPlan: PlanType = validPlans.includes(planType as ValidPlan)
      ? (planType as ValidPlan)
      : 'none';

    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    // Actualiza usuarios
    await Promise.all(
      userIds.map(async (userId) => {
        await db
          .update(users)
          .set({
            planType: normalizedPlan,
            subscriptionStatus: 'active',
            subscriptionEndDate,
          })
          .where(eq(users.id, userId))
          .execute();

        await clerkClient().then((clerk) =>
          clerk.users.updateUserMetadata(userId, {
            publicMetadata: {
              planType: normalizedPlan,
              subscriptionStatus: 'active',
              subscriptionEndDate: formatDateToClerk(subscriptionEndDate),
            },
          })
        );
      })
    );

    const existingEnrollments = await db
      .select({ userId: enrollments.userId })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.courseId, parsedCourseId),
          inArray(enrollments.userId, userIds)
        )
      )
      .execute();

    const alreadyEnrolled = new Set(existingEnrollments.map((e) => e.userId));
    const newEnrollments = userIds.filter((id) => !alreadyEnrolled.has(id));

    if (newEnrollments.length > 0) {
      await db.insert(enrollments).values(
        newEnrollments.map((userId) => ({
          userId,
          courseId: parsedCourseId,
          enrolledAt: new Date(),
          completed: false,
        }))
      );

      // Insertar progreso de lecciones si aplica
      const courseLessons = await db.query.lessons.findMany({
        where: eq(lessons.courseId, parsedCourseId),
      });

      const sortedLessons = sortLessons(courseLessons);

      // Buscar específicamente la lección con orderIndex = 1
      const firstLessonWithOrderIndex = courseLessons.find(
        (lesson) => lesson.orderIndex === 1
      );
      const firstLessonId = firstLessonWithOrderIndex?.id ?? null;

      for (const userId of newEnrollments) {
        const existingProgress = await db.query.userLessonsProgress.findMany({
          where: and(
            eq(userLessonsProgress.userId, userId),
            inArray(
              userLessonsProgress.lessonId,
              sortedLessons.map((l) => l.id)
            )
          ),
        });

        const existingProgressSet = new Set(
          existingProgress.map((p) => p.lessonId)
        );

        for (const lesson of sortedLessons) {
          // Desbloquear solo la lección con orderIndex = 1
          const isFirstLesson =
            firstLessonId !== null && lesson.id === firstLessonId;

          if (!existingProgressSet.has(lesson.id)) {
            // Insertar nueva lección
            await db.insert(userLessonsProgress).values({
              userId,
              lessonId: lesson.id,
              progress: 0,
              isCompleted: false,
              isLocked: !isFirstLesson,
              isNew: isFirstLesson,
              lastUpdated: new Date(),
            });

            console.log('📝 Lección INSERTADA:', {
              lessonId: lesson.id,
              userId,
              isLocked: !isFirstLesson,
            });
          } else {
            // Actualizar lección existente
            await db
              .update(userLessonsProgress)
              .set({
                isLocked: !isFirstLesson,
                isNew: isFirstLesson,
                lastUpdated: new Date(),
              })
              .where(
                and(
                  eq(userLessonsProgress.userId, userId),
                  eq(userLessonsProgress.lessonId, lesson.id)
                )
              );

            console.log('🔄 Lección ACTUALIZADA:', {
              lessonId: lesson.id,
              userId,
              isLocked: !isFirstLesson,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Matrícula completada',
    });
  } catch (error) {
    console.error('Error en matrícula:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
