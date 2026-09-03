'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { sendTicketEmail } from '~/lib/emails/ticketEmails';
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
import { generarPasswordSegura } from '~/utils/generatePassword';

type ClerkProvisionResult = {
  clerkUserId: string;
  wasCreated: boolean;
  temporaryPassword?: string;
};

function buildNamesFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'estudiante';
  const cleaned = local.replace(/[^a-zA-Z0-9._-]/g, ' ').trim();
  const parts = cleaned
    .split(/[._\-\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const firstNameRaw = parts[0] ?? 'Estudiante';
  const lastNameRaw = parts.slice(1).join(' ') || 'Artiefy';

  const toTitle = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

  return {
    firstName: toTitle(firstNameRaw.slice(0, 40)),
    lastName: toTitle(lastNameRaw.slice(0, 60)),
  };
}

async function ensureClerkUserByEmail(
  normalizedEmail: string
): Promise<ClerkProvisionResult> {
  const clerk = await clerkClient();
  const clerkUsers = await clerk.users.getUserList({
    emailAddress: [normalizedEmail],
  });

  if (clerkUsers.totalCount > 0) {
    return {
      clerkUserId: clerkUsers.data[0]!.id,
      wasCreated: false,
    };
  }

  const { firstName, lastName } = buildNamesFromEmail(normalizedEmail);
  const temporaryPassword = generarPasswordSegura();
  const base = normalizedEmail
    .split('@')[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 16);
  const username = `payu_${base || 'student'}_${Date.now().toString(36)}`;

  const created = await clerk.users.createUser({
    firstName,
    lastName,
    username: username.slice(0, 40),
    password: temporaryPassword,
    emailAddress: [normalizedEmail],
    publicMetadata: {
      role: 'estudiante',
      mustChangePassword: true,
      subscriptionStatus: 'inactive',
      createdFrom: 'payu_guided_project_payment',
    },
  });

  return {
    clerkUserId: created.id,
    wasCreated: true,
    temporaryPassword,
  };
}

async function sendGuidedProjectAccessCredentialsEmail(params: {
  to: string;
  temporaryPassword: string;
  guidedProjectId: number;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
    'https://artiefy.com';
  const signInUrl = `${baseUrl}/sign-in`;
  const projectUrl = `${baseUrl}/estudiantes/proyectos-guiados/${params.guidedProjectId}`;

  await sendTicketEmail({
    to: params.to,
    subject: 'Tu acceso a Artiefy y a tu proyecto guiado ya está listo',
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Compra confirmada</h2>
        <p>Ya registramos tu compra del proyecto guiado. Creamos una cuenta para que ingreses con este mismo correo:</p>
        <p style="margin: 12px 0;"><strong>Correo:</strong> ${params.to}</p>
        <p style="margin: 12px 0;"><strong>Contraseña temporal:</strong> ${params.temporaryPassword}</p>
        <p style="margin: 12px 0;">Al entrar, cambia tu contraseña desde tu perfil o usando "Olvidé mi contraseña".</p>
        <p style="margin: 16px 0;">
          <a href="${signInUrl}" style="display: inline-block; background: #22c4d3; color: #00111f; padding: 10px 14px; border-radius: 999px; text-decoration: none; font-weight: 700;">
            Ingresar a Artiefy
          </a>
        </p>
        <p style="margin: 12px 0;">Tu proyecto guiado estará disponible en: <a href="${projectUrl}">${projectUrl}</a></p>
      </div>
    `,
  });
}

/**
 * Enrolls a PayU single-payment buyer into a guided project, provisioning the
 * Clerk account when the buyer had none. The enrollment is marked permanent so
 * access never depends on an active Pro/Premium subscription — the same rule
 * the individual course purchase follows.
 */
export async function enrollUserInGuidedProject(
  userEmail: string,
  guidedProjectId: number
) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  console.log('📝 Starting guided project enrollment process:', {
    userEmail: normalizedEmail,
    guidedProjectId,
  });

  try {
    const project = await db.query.guidedProjects.findFirst({
      where: eq(guidedProjects.id, guidedProjectId),
    });

    if (!project) {
      throw new Error(`Proyecto guiado ${guidedProjectId} no encontrado`);
    }

    let user = await db.query.users.findFirst({
      where: and(
        eq(users.email, normalizedEmail),
        eq(users.role, 'estudiante')
      ),
    });

    const clerkProvision = await ensureClerkUserByEmail(normalizedEmail);

    if (!user) {
      await db.insert(users).values({
        id: clerkProvision.clerkUserId,
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        role: 'estudiante',
        subscriptionStatus: 'inactive',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      user = await db.query.users.findFirst({
        where: and(
          eq(users.email, normalizedEmail),
          eq(users.role, 'estudiante')
        ),
      });

      if (!user) {
        throw new Error('Error al crear el usuario en la base de datos');
      }

      console.log('✅ New user created:', { id: user.id, email: user.email });
    } else if (user.id !== clerkProvision.clerkUserId) {
      console.error('❌ Usuario legacy desalineado entre DB y Clerk.', {
        email: normalizedEmail,
        dbUserId: user.id,
        clerkUserId: clerkProvision.clerkUserId,
      });
      throw new Error(
        'Conflicto de identidad detectado: el usuario existe con distinto ID en DB y Clerk. Requiere reconciliación para evitar desalineación de acceso.'
      );
    }

    if (clerkProvision.wasCreated && clerkProvision.temporaryPassword) {
      await sendGuidedProjectAccessCredentialsEmail({
        to: normalizedEmail,
        temporaryPassword: clerkProvision.temporaryPassword,
        guidedProjectId,
      });
      console.log('📧 Credenciales enviadas al comprador:', normalizedEmail);
    }

    const existingEnrollment = await db.query.guidedEnrollments.findFirst({
      where: and(
        eq(guidedEnrollments.userId, user.id),
        eq(guidedEnrollments.guidedProjectId, guidedProjectId)
      ),
    });

    if (existingEnrollment) {
      // A subscription enrollment already exists: upgrade it to permanent so
      // the paid access survives the subscription expiring.
      if (!existingEnrollment.isPermanent) {
        await db
          .update(guidedEnrollments)
          .set({ isPermanent: true })
          .where(eq(guidedEnrollments.id, existingEnrollment.id));
        console.log('🔁 Enrollment upgraded to permanent:', {
          enrollmentId: existingEnrollment.id,
        });
      }
    } else {
      await db.insert(guidedEnrollments).values({
        userId: user.id,
        guidedProjectId,
        enrolledAt: new Date(),
        completed: false,
        isPermanent: true,
      });
    }

    // Configurar progreso base para objetivos y actividades
    const objectives = await db.query.guidedObjectives.findMany({
      where: eq(guidedObjectives.guidedProjectId, guidedProjectId),
    });

    for (const objective of objectives) {
      await db
        .insert(userObjectiveProgress)
        .values({
          userId: user.id,
          objectiveId: objective.id,
          progress: 0,
          lastPositionSeconds: 0,
          isCompleted: false,
          isLocked: !objective.isEnabled,
          isNew: true,
        })
        .onConflictDoNothing();

      const activities = await db.query.guidedObjectiveActivities.findMany({
        where: eq(guidedObjectiveActivities.objectiveId, objective.id),
      });

      for (const activity of activities) {
        await db
          .insert(userGuidedActivityProgress)
          .values({
            userId: user.id,
            activityId: activity.id,
            progress: 0,
            isCompleted: false,
            revisada: false,
            attemptCount: 0,
            finalGrade: null,
          })
          .onConflictDoNothing();
      }
    }

    console.log('✅ Guided project enrollment successful:', {
      userId: user.id,
      email: user.email,
      guidedProjectId,
      objectivesProcessed: objectives.length,
      clerkAccountCreated: clerkProvision.wasCreated,
    });

    return {
      success: true,
      message: 'Inscripción exitosa',
      clerkAccountCreated: clerkProvision.wasCreated,
      credentialsSent: clerkProvision.wasCreated,
    };
  } catch (error) {
    console.error('❌ Guided project enrollment error:', error);
    throw error;
  }
}
