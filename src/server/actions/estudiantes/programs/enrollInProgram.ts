'use server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

import { createNotification } from '~/server/actions/notifications/createNotification';
import { db } from '~/server/db';
import { users, enrollmentPrograms, programas } from '~/server/db/schema';

export async function enrollInProgram(
  programId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return {
        success: false,
        message: 'Usuario no autenticado',
      };
    }

    const userId = user.id;

    // Check if user exists in our database
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

      // Create user if doesn't exist
      try {
        await db.insert(users).values({
          id: userId,
          name:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : (user.firstName ?? 'Usuario'),
          email: primaryEmail.emailAddress,
          role: 'estudiante',
          subscriptionStatus: 'active', // Set based on Clerk metadata
          createdAt: new Date(),
          updatedAt: new Date(),
        });

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

    // Verify subscription status from Clerk metadata
    const subscriptionStatus = user.publicMetadata?.subscriptionStatus;
    const planType = user.publicMetadata?.planType;
    const subscriptionEndDate = user.publicMetadata?.subscriptionEndDate as
      | string
      | null;

    const isSubscriptionValid =
      subscriptionStatus === 'active' &&
      planType === 'Premium' && // Only Premium plans can enroll in programs
      (!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());

    if (!isSubscriptionValid) {
      return {
        success: false,
        message:
          planType === 'Pro'
            ? 'Los programas requieren una suscripción Premium. Actualiza tu plan para acceder.'
            : 'Se requiere una suscripción premium activa',
      };
    }

    // Check if already enrolled
    const existingEnrollment = await db.query.enrollmentPrograms.findFirst({
      where: and(
        eq(enrollmentPrograms.userId, userId),
        eq(enrollmentPrograms.programaId, programId)
      ),
    });

    if (existingEnrollment) {
      return {
        success: false,
        message: 'Ya estás inscrito en este programa',
      };
    }

    // Create enrollment
    await db.insert(enrollmentPrograms).values({
      userId: userId,
      programaId: programId,
      enrolledAt: new Date(),
      completed: false,
    });

    // Get program details first
    try {
      const program = await db.query.programas.findFirst({
        where: eq(programas.id, programId),
        columns: {
          id: true,
          title: true,
        },
      });

      if (!program) {
        return {
          success: false,
          message: 'Programa no encontrado',
        };
      }

      await createNotification({
        userId,
        type: 'PROGRAM_ENROLLMENT',
        title: '¡Inscripción exitosa!',
        message: `Te has inscrito al programa ${program.title}`,
        metadata: { programId },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // Continue execution even if notification fails
    }

    return {
      success: true,
      message: 'Inscripción exitosa al programa',
    };
  } catch (error) {
    console.error('Error en enrollInProgram:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function isUserEnrolledInProgram(
  programId: number,
  userId: string
): Promise<boolean> {
  try {
    const existingEnrollment = await db.query.enrollmentPrograms.findFirst({
      where: and(
        eq(enrollmentPrograms.userId, userId),
        eq(enrollmentPrograms.programaId, programId)
      ),
    });
    return !!existingEnrollment;
  } catch (error) {
    console.error('Error checking program enrollment:', error);
    throw new Error('Failed to check program enrollment status');
  }
}
