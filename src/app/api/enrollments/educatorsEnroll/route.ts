import { NextResponse } from 'next/server';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  enrollments,
  lessons,
  userLessonsProgress,
  users,
} from '~/server/db/schema';
import { fusionarMetadatosPublicos } from '~/server/lib/clerk-metadata';
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

    const unMesDesdeHoy = new Date();
    unMesDesdeHoy.setMonth(unMesDesdeHoy.getMonth() + 1);

    // Actualiza usuarios
    //
    // Matricular NUNCA debe recortar una suscripción existente. Antes esto
    // escribía "hoy + 1 mes" sin mirar: a un educador que abría su curso —o a
    // un estudiante que ya había pagado hasta diciembre— se le reducía el
    // acceso a un mes. Ahora se conserva siempre la fecha más lejana, y el
    // plan solo se cambia si no había uno activo.
    await Promise.all(
      userIds.map(async (userId) => {
        const actual = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            planType: true,
            subscriptionStatus: true,
            subscriptionEndDate: true,
          },
        });

        const fechaActual = actual?.subscriptionEndDate
          ? new Date(actual.subscriptionEndDate)
          : null;

        const sigueVigente =
          fechaActual !== null && fechaActual.getTime() > Date.now();

        const nuevaFecha =
          fechaActual && fechaActual > unMesDesdeHoy
            ? fechaActual
            : unMesDesdeHoy;

        // Si ya tenía un plan vigente, se respeta: matricular a un curso no
        // es motivo para cambiarle el plan que compró.
        const planFinal =
          sigueVigente && actual?.planType && actual.planType !== 'none'
            ? (actual.planType as PlanType)
            : normalizedPlan;

        await db
          .update(users)
          .set({
            planType: planFinal,
            subscriptionStatus: 'active',
            subscriptionEndDate: nuevaFecha,
          })
          .where(eq(users.id, userId))
          .execute();

        // Fusiona en vez de reemplazar: escribir el objeto entero borraba
        // `role` y degradaba al educador a estudiante.
        await fusionarMetadatosPublicos(userId, {
          planType: planFinal,
          subscriptionStatus: 'active',
          subscriptionEndDate: formatDateToClerk(nuevaFecha),
        });
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
