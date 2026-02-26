import { NextRequest, NextResponse } from 'next/server';

// Agrega import para crear notificación
import { clerkClient } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { EmailTemplateProjectInvitation } from '~/components/estudiantes/layout/EmailTemplateProjectInvitation';
import { sendTicketEmail } from '~/lib/emails/ticketEmails';
import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { projectInvitations, projects, users } from '~/server/db/schema';

export async function POST(req: NextRequest) {
  try {
    if (req.method && req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Método no permitido' },
        { status: 405 }
      );
    }

    const body = await req.json();
    console.log('Invitacion body:', body);

    const { invitedUserId, projectId, invitedByUserId, invitationMessage } =
      body;

    if (!invitedUserId || !projectId || !invitedByUserId) {
      console.error('Faltan parámetros:', {
        invitedUserId,
        projectId,
        invitedByUserId,
      });
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios' },
        { status: 400 }
      );
    }

    const invitedUserIdStr = String(invitedUserId);
    const projectIdNum = Number(projectId);
    const invitedByUserIdStr = String(invitedByUserId);

    if (!invitedUserIdStr || !invitedByUserIdStr || isNaN(projectIdNum)) {
      console.error('Parámetros inválidos:', {
        invitedUserIdStr,
        projectIdNum,
        invitedByUserIdStr,
      });
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

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
    } catch (error) {
      console.error('Error verificando usuarios:', error);
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

    console.log('Invitaciones existentes:', existing);

    if (existing.length > 0) {
      console.warn('Ya existe invitación pendiente:', existing);
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
    console.log('Insertando invitación:', insertData);

    const result = await db
      .insert(projectInvitations)
      .values(insertData)
      .returning();

    console.log('Invitación creada:', result);

    if (!result || result.length === 0) {
      console.error('No se pudo crear la invitación');
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

        console.log('✅ Email de invitación enviado a:', invitedUserEmail);
      }
    } catch (emailError) {
      console.error('❌ Error al enviar email de invitación:', emailError);
      // No falla el endpoint si el email falla
    }

    return NextResponse.json(
      { success: true, invitation: result[0] },
      { status: 201 }
    );
  } catch (_err) {
    console.error('Error al crear la invitación:', _err);
    return NextResponse.json(
      { error: 'Error al crear la invitación' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');

  if (!userId && !projectId) {
    return NextResponse.json(
      { error: 'Falta userId o projectId' },
      { status: 400 }
    );
  }

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
      .set({ status })
      .where(eq(projectInvitations.id, Number(id))) // Asegura tipo number
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
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
  }
  try {
    await db
      .delete(projectInvitations)
      .where(eq(projectInvitations.invitedUserId, String(userId))); // Asegura tipo string
    return NextResponse.json({ success: true });
  } catch (_err) {
    return NextResponse.json(
      { error: 'Error al eliminar invitaciones' },
      { status: 500 }
    );
  }
}
