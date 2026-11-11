import { NextRequest, NextResponse } from 'next/server';

// Agrega import para crear notificación
import { clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { EmailTemplateProjectInvitation } from '~/components/estudiantes/layout/EmailTemplateProjectInvitation';
import { sendTicketEmail } from '~/lib/emails/ticketEmails';
import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { projectInvitations, projects, users } from '~/server/db/schema';
import { getApiSession } from '~/server/utils/apiAuth';

const unauthorized = () =>
  NextResponse.json({ error: 'No autorizado' }, { status: 401 });
const forbidden = () =>
  NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

async function getProjectOwnerId(projectId: number) {
  const rows = await db
    .select({ userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return rows[0]?.userId ?? null;
}

export async function POST(req: NextRequest) {
  try {
    if (req.method && req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Método no permitido' },
        { status: 405 }
      );
    }

    const session = await getApiSession();
    if (!session.userId) return unauthorized();

    const body = await req.json();

    const { invitedUserId, projectId, invitationMessage } = body;

    // The inviter is always the signed-in user; any client value is ignored.
    const invitedByUserId = session.userId;

    if (!invitedUserId || !projectId) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios' },
        { status: 400 }
      );
    }

    const invitedUserIdStr = String(invitedUserId);
    const projectIdNum = Number(projectId);
    const invitedByUserIdStr = String(invitedByUserId);

    if (!invitedUserIdStr || !invitedByUserIdStr || isNaN(projectIdNum)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    // Only the project owner may invite people to it.
    const ownerId = await getProjectOwnerId(projectIdNum);
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }
    if (ownerId !== invitedByUserIdStr) return forbidden();

    const ensureUserExists = async (userIdToEnsure: string) => {
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userIdToEnsure))
        .limit(1);

      if (existingUser.length > 0) return;

      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(userIdToEnsure);
      const email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses?.[0]?.emailAddress ??
        '';

      if (!email) {
        throw new Error('No se encontró email del usuario en Clerk');
      }

      const firstName = clerkUser.firstName?.trim() ?? '';
      const lastName = clerkUser.lastName?.trim() ?? '';
      const name = [firstName, lastName].filter(Boolean).join(' ') || email;
      const roleRaw =
        typeof clerkUser.publicMetadata?.role === 'string'
          ? String(clerkUser.publicMetadata?.role).trim().toLowerCase()
          : 'estudiante';
      const role =
        roleRaw === 'educador' ||
        roleRaw === 'admin' ||
        roleRaw === 'super-admin'
          ? roleRaw
          : 'estudiante';

      await db.insert(users).values({
        id: userIdToEnsure,
        role,
        name,
        email,
      });
    };

    try {
      await ensureUserExists(invitedUserIdStr);
      await ensureUserExists(invitedByUserIdStr);
    } catch {
      return NextResponse.json(
        { error: 'No se pudo validar el usuario invitado' },
        { status: 400 }
      );
    }

    // Verifica si ya existe una invitación pendiente para ese usuario y proyecto
    const existing = await db
      .select()
      .from(projectInvitations)
      .where(
        and(
          eq(projectInvitations.invitedUserId, invitedUserIdStr),
          eq(projectInvitations.projectId, projectIdNum),
          eq(projectInvitations.status, 'pending')
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este usuario' },
        { status: 409 }
      );
    }

    // Crea la invitación
    const insertData = {
      invitedUserId: invitedUserIdStr,
      projectId: projectIdNum,
      invitedByUserId: invitedByUserIdStr,
      invitationMessage:
        typeof invitationMessage === 'string' ? invitationMessage : undefined,
      status: 'pending' as const,
    };
    const result = await db
      .insert(projectInvitations)
      .values(insertData)
      .returning();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'No se pudo crear la invitación' },
        { status: 500 }
      );
    }

    // Crear notificación para el usuario invitado (NO participation-request)
    await createNotification({
      userId: invitedUserIdStr,
      type: 'PROJECT_INVITATION', // Usa un tipo diferente a 'participation-request'
      title: 'Invitación a un proyecto',
      message:
        typeof invitationMessage === 'string'
          ? invitationMessage
          : 'Has sido invitado a un proyecto',
      metadata: {
        projectId: projectIdNum,
        invitedByUserId: invitedByUserIdStr,
      },
    });

    // Enviar email de invitación
    try {
      // Obtener información del proyecto
      const projectData = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectIdNum))
        .limit(1);

      const projectName = projectData[0]?.name ?? 'el proyecto';

      // Obtener información del usuario invitado
      const invitedUserData = await db
        .select()
        .from(users)
        .where(eq(users.id, invitedUserIdStr))
        .limit(1);

      const invitedUserEmail = invitedUserData[0]?.email ?? '';
      const invitedUserName = invitedUserData[0]?.name ?? '';

      // Obtener información del usuario que invita
      const invitedByUserData = await db
        .select()
        .from(users)
        .where(eq(users.id, invitedByUserIdStr))
        .limit(1);

      const invitedByUserName = invitedByUserData[0]?.name ?? 'Un usuario';

      if (invitedUserEmail) {
        // Construir URL de aceptación
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';
        const acceptUrl = `${baseUrl}/proyectos?acceptInvitation=${result[0]?.id}`;

        const htmlContent = EmailTemplateProjectInvitation({
          invitedUserName,
          invitedByUserName,
          projectName,
          invitationMessage:
            typeof invitationMessage === 'string'
              ? invitationMessage
              : undefined,
          acceptUrl,
        });

        await sendTicketEmail({
          to: invitedUserEmail,
          subject: `Invitación al proyecto: ${projectName}`,
          html: htmlContent,
          attachments: [
            {
              filename: 'artiefy-logo2.png',
              path: `${process.cwd()}/public/artiefy-logo2.png`,
              cid: 'logo@artiefy.com',
              contentType: 'image/png',
            },
          ],
        });
      }
    } catch {
      // No falla el endpoint si el email falla
    }

    return NextResponse.json(
      { success: true, invitation: result[0] },
      { status: 201 }
    );
  } catch (_err) {
    return NextResponse.json(
      { error: 'Error al crear la invitación' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getApiSession();
  if (!session.userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');

  if (!userId && !projectId) {
    return NextResponse.json(
      { error: 'Falta userId o projectId' },
      { status: 400 }
    );
  }

  // A user may only list their own received invitations.
  if (userId && userId !== session.userId) return forbidden();

  try {
    if (userId) {
      // Buscar invitaciones para el usuario
      const invitaciones = await db
        .select({
          id: projectInvitations.id,
          projectId: projectInvitations.projectId,
          invitedByUserId: projectInvitations.invitedByUserId,
          invitationMessage: projectInvitations.invitationMessage,
          status: projectInvitations.status,
          projectName: projects.name,
        })
        .from(projectInvitations)
        .leftJoin(projects, eq(projectInvitations.projectId, projects.id))
        .where(eq(projectInvitations.invitedUserId, userId));
      // Mapear al formato esperado por el frontend
      const mapped = invitaciones.map((inv) => ({
        id: inv.id,
        projectId: inv.projectId,
        projectName: inv.projectName ?? String(inv.projectId),
        fromUser: String(inv.invitedByUserId),
        message: inv.invitationMessage ?? '',
        status: inv.status,
      }));
      return NextResponse.json(mapped);
    } else if (projectId) {
      const projectIdNum = Number(projectId);
      if (isNaN(projectIdNum)) {
        return NextResponse.json(
          { error: 'projectId inválido' },
          { status: 400 }
        );
      }
      // Invitations of a project are visible to its owner (or staff) only.
      const projectOwnerId = await getProjectOwnerId(projectIdNum);
      if (projectOwnerId !== session.userId && !session.isStaff) {
        return forbidden();
      }
      const invitaciones = await db
        .select()
        .from(projectInvitations)
        .where(eq(projectInvitations.projectId, projectIdNum));
      const mapped = invitaciones.map((inv) => ({
        id: inv.id,
        invitedUserId: inv.invitedUserId,
        status: inv.status,
      }));
      return NextResponse.json({ invitations: mapped });
    }
    // Fallback
    return NextResponse.json([], { status: 200 });
  } catch (_err) {
    return NextResponse.json(
      { error: 'Error al obtener invitaciones' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getApiSession();
    if (!session.userId) return unauthorized();

    const body = await req.json();
    const { id, status } = body;
    const statusStr = String(status);
    if (!id || !['accepted', 'rejected'].includes(statusStr)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }
    const updated = await db
      .update(projectInvitations)
      .set({ status: statusStr as 'accepted' | 'rejected' })
      .where(
        and(
          eq(projectInvitations.id, Number(id)),
          // Only the invited user can accept or reject an invitation.
          eq(projectInvitations.invitedUserId, session.userId)
        )
      )
      .returning();
    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró la invitación' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (_err) {
    // Cambia err por _err
    return NextResponse.json(
      { error: 'Error al actualizar invitación' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getApiSession();
  if (!session.userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    // Single invitation by id (JSON body): allowed to its invited user, its
    // inviter, the project owner or staff.
    const body = (await req.json().catch(() => null)) as {
      id?: unknown;
    } | null;
    const invitationId = Number(body?.id);
    if (!Number.isInteger(invitationId)) {
      return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
    }
    try {
      const found = await db
        .select({
          invitedUserId: projectInvitations.invitedUserId,
          invitedByUserId: projectInvitations.invitedByUserId,
          projectId: projectInvitations.projectId,
        })
        .from(projectInvitations)
        .where(eq(projectInvitations.id, invitationId))
        .limit(1);
      const invitation = found[0];
      if (!invitation) {
        return NextResponse.json(
          { error: 'No se encontró la invitación' },
          { status: 404 }
        );
      }
      const projectOwnerId = await getProjectOwnerId(invitation.projectId);
      const allowed =
        session.isStaff ||
        invitation.invitedUserId === session.userId ||
        invitation.invitedByUserId === session.userId ||
        projectOwnerId === session.userId;
      if (!allowed) return forbidden();
      await db
        .delete(projectInvitations)
        .where(eq(projectInvitations.id, invitationId));
      return NextResponse.json({ success: true });
    } catch (_err) {
      return NextResponse.json(
        { error: 'Error al eliminar invitaciones' },
        { status: 500 }
      );
    }
  }
  // Bulk delete: a user may only clear their own received invitations.
  if (String(userId) !== session.userId) return forbidden();
  try {
    await db
      .delete(projectInvitations)
      .where(eq(projectInvitations.invitedUserId, session.userId));
    return NextResponse.json({ success: true });
  } catch (_err) {
    return NextResponse.json(
      { error: 'Error al eliminar invitaciones' },
      { status: 500 }
    );
  }
}
