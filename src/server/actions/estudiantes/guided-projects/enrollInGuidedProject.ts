'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import {
  guidedEnrollments,
  guidedObjectiveActivities,
  guidedObjectives,
  guidedProjects,
  userGuidedActivityProgress,
  userObjectiveProgress,
  users,
} from '~/server/db/schema';

import type { EnrollmentResponse } from '~/types';

export async function enrollInGuidedProject(
  guidedProjectId: number
): Promise<EnrollmentResponse> {
  try {
    const user = await currentUser();
    const { userId } = await auth();

    if (!userId || !user) {
      return {
        success: false,
        message: 'Debes iniciar sesión para inscribirte',
      };
    }

    // 1. Verificar suscripción activa (Pro o Premium)
    const userPlanType = user.publicMetadata?.planType as string | undefined;
    const subscriptionStatus = user.publicMetadata?.subscriptionStatus as
      | string
      | undefined;
    const subscriptionEndDate = user.publicMetadata?.subscriptionEndDate as
      | string
      | null
      | undefined;

    const isSubscriptionValid =
      subscriptionStatus === 'active' &&
      (!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

    const hasValidPlan =
      userPlanType === 'Pro' ||
      userPlanType === 'Premium' ||
      userPlanType === 'Enterprise';

    if (!isSubscriptionValid || !hasValidPlan) {
      return {
        success: false,
        message:
          'Se requiere una suscripción Pro o Premium activa para acceder a los proyectos guiados.',
        requiresSubscription: true,
      };
    }

    // 2. Verificar si el proyecto existe
    const project = await db.query.guidedProjects.findFirst({
      where: eq(guidedProjects.id, guidedProjectId),
    });

    if (!project) {
      return {
        success: false,
        message: 'Proyecto guiado no encontrado',
      };
    }

    // Verificar usuario local
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!dbUser) {
      // En un caso real crearíamos el usuario, simplificado acá por seguridad.
      return {
        success: false,
        message: 'Usuario no encontrado en la base de datos',
      };
    }

    // Verificar si ya está inscrito
    const existingEnrollment = await db.query.guidedEnrollments.findFirst({
      where: and(
        eq(guidedEnrollments.userId, userId),
        eq(guidedEnrollments.guidedProjectId, guidedProjectId)
      ),
    });

    if (existingEnrollment) {
      return {
        success: true,
        message: 'Ya estás inscrito en este proyecto guiado',
      };
    }

    // Crear inscripción
    await db.insert(guidedEnrollments).values({
      userId: userId,
      guidedProjectId: guidedProjectId,
      enrolledAt: new Date(),
      completed: false,
      isPermanent: false,
    });

    // Create notification
    try {
      await createNotification({
        userId,
        type: 'COURSE_ENROLLMENT', // Or generic enrollment
        title: '¡Inscripción exitosa!',
        message: `Te has inscrito al proyecto guiado ${project.title}`,
        metadata: { guidedProjectId },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    // Configurar progreso base para objetivos
    const objectives = await db.query.guidedObjectives.findMany({
      where: eq(guidedObjectives.guidedProjectId, guidedProjectId),
    });

    // Crear progreso de objetivos
    for (const objective of objectives) {
      // Intentar insertar progreso de objetivo
      try {
        await db
          .insert(userObjectiveProgress)
          .values({
            userId: userId,
            objectiveId: objective.id,
            progress: 0,
            lastPositionSeconds: 0,
            isCompleted: false,
            isLocked: !objective.isEnabled,
            isNew: true,
          })
          .onConflictDoNothing();
      } catch (err) {
        console.error('Error inserting objective progress:', err);
      }

      // Obtener actividades del objetivo
      const activities = await db.query.guidedObjectiveActivities.findMany({
        where: eq(guidedObjectiveActivities.objectiveId, objective.id),
      });

      // Crear progreso de actividades
      for (const activity of activities) {
        try {
          await db
            .insert(userGuidedActivityProgress)
            .values({
              userId: userId,
              activityId: activity.id,
              progress: 0,
              isCompleted: false,
              revisada: false,
              attemptCount: 0,
              finalGrade: null,
            })
            .onConflictDoNothing();
        } catch (err) {
          console.error('Error inserting activity progress:', err);
        }
      }
    }

    return {
      success: true,
      message: '¡Te has inscrito exitosamente al proyecto guiado!',
    };
  } catch (error) {
    console.error('Error enrollInGuidedProject:', error);
    return {
      success: false,
      message:
        'Ocurrió un error al intentar inscribirte. Por favor, intenta de nuevo.',
    };
  }
}
