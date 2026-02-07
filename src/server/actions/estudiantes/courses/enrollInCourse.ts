'use server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm'; // Quitar inArray

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

export async function enrollInCourse(
  courseId: number
): Promise<EnrollmentResponse> {
  let course:
    | (typeof courses.$inferSelect & {
        courseType?: { requiredSubscriptionLevel?: string } | null;
      })
    | null = null;

  try {
    const user = await currentUser();

    if (!user?.id) {
      return {
        success: false,
        message: 'Usuario no autenticado',
      };
    }

    const userId = user.id;

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
      const primaryEmail = user.emailAddresses.find(
        (email) => email.id === user.primaryEmailAddressId
      );

      if (!primaryEmail?.emailAddress) {
        return {
          success: false,
          message: 'No se pudo obtener el email del usuario',
        };
      }

      try {
        await db.insert(users).values({
          id: userId,
          name:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : (user.firstName ?? 'Usuario'),
          email: primaryEmail.emailAddress,
          role: 'estudiante',
          subscriptionStatus: shouldBeActive ? 'active' : 'inactive', // Set based on course type
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
    const userPlanType = user.publicMetadata?.planType as string | undefined;
    const normalizedPlan = (userPlanType ?? '').toLowerCase();
    const subscriptionStatus = user.publicMetadata?.subscriptionStatus;
    const subscriptionEndDate = user.publicMetadata?.subscriptionEndDate as
      | string
      | null;

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

    // Sort lessons using our shared sorting utility
    const sortedLessons = sortLessons(courseLessons); // sortLessons usa orderIndex

    const firstLesson =
      sortedLessons.find((lesson) => lesson.orderIndex === 1) ??
      sortedLessons[0];
    const firstLessonId = firstLesson?.id;

    // Obtén los IDs de las lecciones que ya tienen progreso
    const existingProgress = await db.query.userLessonsProgress.findMany({
      where: eq(userLessonsProgress.userId, userId),
    });
    const existingLessonIds = new Set(existingProgress.map((p) => p.lessonId));

    // Solo crea progreso para las lecciones que no existen aún
    const progressValues = sortedLessons
      .filter((lesson) => !existingLessonIds.has(lesson.id))
      .map((lesson) => ({
        userId: userId,
        lessonId: lesson.id,
        progress: 0,
        isCompleted: false,
        isLocked: firstLessonId ? lesson.id !== firstLessonId : true,
        isNew: firstLessonId ? lesson.id === firstLessonId : false,
        lastUpdated: new Date(),
      }));

    // Inserta solo las nuevas lecciones de una vez
    await Promise.all(
      progressValues.map((values) =>
        db.insert(userLessonsProgress).values(values).onConflictDoNothing()
      )
    );

    // Ya usamos sortLessons que ahora prioriza orderIndex, por lo que la primera lección
    // se desbloqueará correctamente según orderIndex si está definido.

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
