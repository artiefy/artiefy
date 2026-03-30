'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import {
  courseCourseTypes,
  courses,
  enrollments,
  lessons,
  userLessonsProgress,
  users,
} from '~/server/db/schema';
import { sortLessons } from '~/utils/lessonSorting';

import type { EnrollmentResponse } from '~/types';

type EnrollmentClientAuthHint = {
  userId?: string | null;
  email?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  planType?: string | null;
  subscriptionStatus?: string | null;
  subscriptionEndDate?: string | null;
};

type PlanType = 'none' | 'Pro' | 'Premium' | 'Enterprise';
const VALID_PLAN_TYPES = new Set<PlanType>([
  'none',
  'Pro',
  'Premium',
  'Enterprise',
]);

const normalizePlanType = (value?: string | null): PlanType | undefined =>
  value && VALID_PLAN_TYPES.has(value as PlanType)
    ? (value as PlanType)
    : undefined;

export async function enrollInCourse(
  courseId: number,
  clientAuthHint?: EnrollmentClientAuthHint
): Promise<EnrollmentResponse> {
  let course:
    | (typeof courses.$inferSelect & {
        courseType?: { requiredSubscriptionLevel?: string } | null;
      })
    | null = null;

  try {
    const user = await currentUser();
    const { userId: authUserId } = await auth();
    const hintedUserId = clientAuthHint?.userId?.trim();

    if (authUserId && hintedUserId && authUserId !== hintedUserId) {
      return {
        success: false,
        message:
          'No se pudo validar tu sesión actual. Recarga la página e inténtalo de nuevo.',
      };
    }

    const userId = user?.id ?? authUserId ?? hintedUserId;

    if (!userId) {
      return {
        success: false,
        message: 'Usuario no autenticado',
      };
    }

    if (!authUserId && hintedUserId && hintedUserId === userId) {
      console.warn(
        '[enrollInCourse] Usando fallback de userId desde cliente por auth() vacío'
      );
    }

    // Get course information first
    const foundCourse = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        courseType: true,
      },
    });
    course = foundCourse ?? null;

    if (!course) {
      return { success: false, message: 'Curso no encontrado' };
    }

    const courseTypesFromJoin = await db.query.courseCourseTypes.findMany({
      where: eq(courseCourseTypes.courseId, courseId),
      with: {
        courseType: true,
      },
    });

    const extraTypes = courseTypesFromJoin
      .map((item) => item.courseType)
      .filter((ct): ct is NonNullable<typeof ct> => !!ct);

    const allCourseTypes = [
      ...(course.courseType ? [course.courseType] : []),
      ...extraTypes,
    ];

    const hasPremium = allCourseTypes.some(
      (t) => t.requiredSubscriptionLevel === 'premium'
    );
    const hasPro = allCourseTypes.some(
      (t) => t.requiredSubscriptionLevel === 'pro'
    );
    const _hasFree = allCourseTypes.some(
      (t) => t.requiredSubscriptionLevel === 'none'
    );

    const effectiveRequiredLevel = hasPremium
      ? hasPro
        ? 'pro' // Mixto premium + pro: permitir ambos planes
        : 'premium'
      : hasPro
        ? 'pro'
        : (course.courseType?.requiredSubscriptionLevel ?? 'none');

    // Determine subscription status based on course type
    const shouldBeActive = effectiveRequiredLevel !== 'none';

    // Check if user exists
    let dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!dbUser) {
      const primaryEmail = user?.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
      );
      const emailToUse =
        primaryEmail?.emailAddress ?? clientAuthHint?.email?.trim() ?? null;

      if (!emailToUse) {
        return {
          success: false,
          message: 'No se pudo obtener el email del usuario',
        };
      }

      const fallbackName =
        clientAuthHint?.fullName?.trim() ||
        `${clientAuthHint?.firstName ?? ''} ${clientAuthHint?.lastName ?? ''}`.trim() ||
        clientAuthHint?.firstName?.trim() ||
        'Usuario';

      const nameToUse =
        user?.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : (user?.firstName ?? fallbackName);

      const hintedPlanType = normalizePlanType(clientAuthHint?.planType);
      const hintedSubscriptionStatus = clientAuthHint?.subscriptionStatus;
      const hintedSubscriptionEndDate = clientAuthHint?.subscriptionEndDate
        ? new Date(clientAuthHint.subscriptionEndDate)
        : null;

      try {
        await db.insert(users).values({
          id: userId,
          name: nameToUse,
          email: emailToUse,
          role: 'estudiante',
          subscriptionStatus:
            hintedSubscriptionStatus ??
            (shouldBeActive ? 'active' : 'inactive'),
          subscriptionEndDate: hintedSubscriptionEndDate,
          planType: hintedPlanType,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Verificar que el usuario se creó correctamente
        dbUser = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!dbUser) {
          throw new Error('Error al crear el usuario en la base de datos');
        }
      } catch (error) {
        console.error('Error creating user:', error);
        return {
          success: false,
          message: 'Error al crear el usuario en la base de datos',
        };
      }
    }

    // 3. Verificar si ya está inscrito
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ),
    });

    if (existingEnrollment) {
      return {
        success: false,
        message: 'Ya estás inscrito en este curso',
      };
    }

    // Verify subscription level requirements
    const userPlanType =
      (user?.publicMetadata?.planType as string | undefined) ??
      clientAuthHint?.planType ??
      dbUser?.planType ??
      undefined;
    const normalizedPlan = (userPlanType ?? '').toLowerCase();
    const subscriptionStatus =
      (user?.publicMetadata?.subscriptionStatus as string | undefined) ??
      clientAuthHint?.subscriptionStatus ??
      dbUser?.subscriptionStatus ??
      undefined;

    const rawSubscriptionEndDate =
      (user?.publicMetadata?.subscriptionEndDate as
        | string
        | null
        | undefined) ??
      clientAuthHint?.subscriptionEndDate ??
      (dbUser?.subscriptionEndDate
        ? new Date(dbUser.subscriptionEndDate).toISOString()
        : null);

    const subscriptionEndDate = rawSubscriptionEndDate;

    const isSubscriptionValid =
      subscriptionStatus === 'active' &&
      (!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

    const requiresSubscription =
      effectiveRequiredLevel !== 'none' || hasPremium || hasPro;

    if (requiresSubscription && !isSubscriptionValid) {
      return {
        success: false,
        message: 'Se requiere una suscripción activa',
        requiresSubscription: true,
      };
    }

    const hasPlanAccess =
      (hasPremium &&
        hasPro &&
        (normalizedPlan === 'premium' || normalizedPlan === 'pro')) ||
      (hasPremium && !hasPro && normalizedPlan === 'premium') ||
      (!hasPremium &&
        hasPro &&
        (normalizedPlan === 'pro' || normalizedPlan === 'premium'));

    if (requiresSubscription && !hasPlanAccess) {
      const message =
        hasPremium && !hasPro
          ? 'Este curso requiere una suscripción Premium. Actualiza tu plan para acceder.'
          : 'Este curso requiere una suscripción Pro o Premium. Actualiza tu plan para acceder.';

      return {
        success: false,
        message,
        requiresSubscription: true,
      };
    }

    // Create enrollment
    await db.insert(enrollments).values({
      userId: userId,
      courseId: courseId,
      enrolledAt: new Date(),
      completed: false,
    });

    // Create notification for course enrollment
    try {
      await createNotification({
        userId,
        type: 'COURSE_ENROLLMENT',
        title: '¡Inscripción exitosa!',
        message: `Te has inscrito al curso ${course.title}`,
        metadata: { courseId },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Continue execution even if notification fails
    }

    // Configure lesson progress with progressive unlocking
    const courseLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, courseId),
    });

    console.log('📚 Lecciones obtenidas del curso:', {
      courseId,
      totalLessons: courseLessons.length,
      lessonsData: courseLessons.map((l) => ({
        id: l.id,
        title: l.title,
        orderIndex: l.orderIndex,
      })),
    });

    // Sort lessons using our shared sorting utility
    const sortedLessons = sortLessons(courseLessons); // sortLessons usa orderIndex

    console.log('📍 Lecciones DESPUÉS de ordenar:', {
      sortedLessons: sortedLessons.map((l) => ({
        id: l.id,
        title: l.title,
        orderIndex: l.orderIndex,
      })),
    });

    // Buscar específicamente la lección con orderIndex = 1
    const firstLesson = courseLessons.find((lesson) => lesson.orderIndex === 1);
    const firstLessonId = firstLesson?.id ?? null;

    console.log('🔓 Primera lección a desbloquear (orderIndex=1):', {
      firstLessonId,
      firstLessonTitle: firstLesson?.title,
      firstLessonOrderIndex: firstLesson?.orderIndex,
      encontrada: !!firstLesson,
    });

    // Obtén los IDs de las lecciones que ya tienen progreso
    const existingProgress = await db.query.userLessonsProgress.findMany({
      where: eq(userLessonsProgress.userId, userId),
    });
    const existingLessonIds = new Set(existingProgress.map((p) => p.lessonId));

    console.log('📊 Progreso existente del usuario:', {
      totalExistingLessons: existingProgress.length,
      existingLessonIds: Array.from(existingLessonIds),
    });

    // Procesar cada lección: insertar nuevas o actualizar existentes
    let createdCount = 0;
    let updatedCount = 0;

    for (const lesson of sortedLessons) {
      const isFirstLesson =
        firstLessonId !== null && lesson.id === firstLessonId;
      const isNew = !existingLessonIds.has(lesson.id);

      if (isNew) {
        // Insertar nueva lección
        await db.insert(userLessonsProgress).values({
          userId: userId,
          lessonId: lesson.id,
          progress: 0,
          isCompleted: false,
          isLocked: !isFirstLesson,
          isNew: isFirstLesson,
          lastUpdated: new Date(),
        });
        createdCount++;

        console.log('📝 Lección INSERTADA:', {
          lessonId: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          isFirstLesson,
          isLocked: !isFirstLesson,
        });
      } else {
        // Actualizar lección existente: cambiar isLocked según si es la primera
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
        updatedCount++;

        console.log('🔄 Lección ACTUALIZADA:', {
          lessonId: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          isFirstLesson,
          isLocked: !isFirstLesson,
        });
      }
    }

    console.log('✅ Progreso actualizado. Resumen:', {
      courseId,
      userId,
      firstLessonId,
      firstLessonTitle: firstLesson?.title,
      totalLessonsProcessed: sortedLessons.length,
      createdCount,
      updatedCount,
    });

    return {
      success: true,
      message: 'Inscripción exitosa',
    };
  } catch (error) {
    console.error(
      'Error en enrollInCourse:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Error desconocido al inscribirse',
      requiresSubscription:
        course?.courseType?.requiredSubscriptionLevel !== 'none',
    };
  }
}

export async function isUserEnrolled(
  courseId: number,
  userId: string
): Promise<boolean> {
  try {
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ),
    });
    return !!existingEnrollment;
  } catch (error) {
    console.error('Error checking enrollment:', error);
    throw new Error('Failed to check enrollment status');
  }
}
