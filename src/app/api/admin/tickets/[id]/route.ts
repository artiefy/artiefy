import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import {
  getNewTicketAssignmentEmail,
  getTicketHistoryEmail,
  sendTicketEmail,
} from '~/lib/emails/ticketEmails';
import { formatDateColombia } from '~/lib/formatDate';
import { db } from '~/server/db';
import {
  notifications,
  ticketAssignees,
  ticketComments,
  tickets,
  users,
} from '~/server/db/schema';
import { SUPPORT_AUTO_ASSIGN_EMAILS } from '~/server/helpers/supportTicketAssignments';
// Tipos seguros
interface UpdateTicketBody {
  assignedToId?: string; // (legacy: asignación única)
  assignedToIds?: string[]; // asignaciones múltiples
  newComment?: string;

  estado?: 'abierto' | 'en proceso' | 'en revision' | 'solucionado' | 'cerrado';
  tipo?: 'otro' | 'bug' | 'revision' | 'logs';

  email?: string;
  description?: string;
  comments?: string;

  coverImageKey?: string | null;
  videoKey?: string | null;
  documentKey?: string | null;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = sessionClaims?.metadata.role;

    if (!userId || (role !== 'admin' && role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const body = (await request.json()) as UpdateTicketBody;

    const currentTicket = await db.query.tickets.findFirst({
      where: eq(tickets.id, ticketId),
    });

    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const statusWillChange =
      typeof body.estado === 'string' &&
      body.estado.length > 0 &&
      body.estado !== currentTicket.estado;

    const isResolvingTicket =
      statusWillChange && ['solucionado', 'cerrado'].includes(body.estado!);

    if (body.newComment?.trim()) {
      // 1) Insertar el comentario del admin
      await db.insert(ticketComments).values({
        ticketId,
        userId,
        sender: 'admin',
        isRead: false,
        content: body.newComment.trim(),
        createdAt: new Date(),
      });

      // 2) Enviar correo al estudiante y crear notificación en campanita
      try {
        const ticket = await db.query.tickets.findFirst({
          where: eq(tickets.id, ticketId),
          with: { creator: true },
        });

        if (ticket?.creator?.email) {
          // Historial completo ascendente para el correo
          const allComments = await db.query.ticketComments.findMany({
            where: eq(ticketComments.ticketId, ticketId),
            with: { user: true },
            orderBy: (comments, { asc }) => [asc(comments.createdAt)],
          });

          const assignmentNoteRegex = /^Ticket asignado a \d+ usuario\(s\)\.$/;
          const commentsForEmail = allComments
            .filter((comment) => !assignmentNoteRegex.test(comment.content))
            .map((comment) => ({
              content: comment.content,
              sender: comment.sender,
              senderName: comment.user?.name ?? 'Usuario',
              createdAt: formatDateColombia(comment.createdAt),
            }));

          const emailHtml = getTicketHistoryEmail(
            ticketId,
            'student',
            ticket.description,
            ticket.estado,
            commentsForEmail
          );

          // Enviar email (esperar para manejar errores)
          const result = await sendTicketEmail({
            to: ticket.creator.email,
            subject: `📬 Nueva respuesta en tu Ticket #${ticketId}`,
            html: emailHtml,
          });
          if (result.success) {
            console.log(
              `✅ Email de notificación enviado al estudiante: ${ticket.creator.email}`
            );
          } else {
            console.error(
              '❌ Error enviando email al estudiante:',
              result.error
            );
          }

          // Notificación en campanita del estudiante
          try {
            await db.insert(notifications).values({
              userId: ticket.creatorId,
              type: 'TICKET_REPLY',
              title: '💬 Nueva respuesta en tu ticket',
              message: `El administrador ha respondido a tu Ticket #${ticketId}. Haz clic para ver la respuesta.`,
              isRead: false,
              isMarked: false,
              createdAt: new Date(),
              metadata: { ticketId },
            });
            console.log(
              `✅ Notificación creada para el estudiante: ${ticket.creator.email}`
            );
          } catch (notifError) {
            console.error('❌ Error creando notificación:', notifError);
          }
        }
      } catch (notifyError) {
        console.error(
          '❌ Error en notificación/correo tras nuevo comentario:',
          notifyError
        );
      }
    }

    if (body.assignedToIds) {
      console.log(
        '🤝 Actualizando asignaciones múltiples:',
        body.assignedToIds
      );

      await db
        .delete(ticketAssignees)
        .where(eq(ticketAssignees.ticketId, ticketId));
      console.log('🗑️ Asignaciones anteriores eliminadas');

      if (body.assignedToIds.length > 0) {
        const newAssignments = body.assignedToIds.map((uid) => ({
          ticketId,
          userId: uid,
        }));

        await Promise.all(
          newAssignments.map((a) => db.insert(ticketAssignees).values(a))
        );
        console.log('✅ Nuevas asignaciones insertadas');

        const assignedUsers: {
          id: string;
          email?: string | null;
          name?: string | null;
        }[] = [];
        // 📧 Enviar correos a asignados
        for (const assignedId of body.assignedToIds) {
          try {
            const assignee = await db.query.users.findFirst({
              where: eq(users.id, assignedId),
            });

            if (assignee?.email) {
              assignedUsers.push({
                id: assignee.id,
                email: assignee.email,
                name: assignee.name,
              });
              console.log('📨 Enviando correo a:', assignee.email);

              const emailResult = await sendTicketEmail({
                to: assignee.email,
                subject: `Nuevo Ticket Asignado #${ticketId}`,
                html: getNewTicketAssignmentEmail(
                  ticketId,
                  body.description ?? currentTicket.description
                ),
              });

              console.log('✉️ Email enviado:', emailResult);
            } else {
              console.log(`ℹ️ Usuario ${assignedId} no tiene correo`);
            }
          } catch (error) {
            console.error(`⚠️ Error enviando a ${assignedId}:`, error);
          }
        }

        // Solo registrar comentario visible si hay asignación manual (no solo auto)
        const defaultEmails = new Set(
          SUPPORT_AUTO_ASSIGN_EMAILS.map((e) => e.toLowerCase())
        );

        const manualAssignees = assignedUsers.filter(
          (u) => u.email && !defaultEmails.has(u.email.toLowerCase())
        );

        const shouldCreateAssignmentComment = manualAssignees.length > 0;

        if (shouldCreateAssignmentComment && manualAssignees.length > 0) {
          const names = manualAssignees.map(
            (u) => u.name ?? u.email ?? 'Administrador'
          );
          await db.insert(ticketComments).values({
            ticketId,
            userId,
            content: `El asesor ${names.join(', ')} ha sido asignado al ticket #${ticketId} para ayudarte con cualquier duda o inconveniente en Artiefy.`,
            isRead: false,
            createdAt: new Date(),
          });

          console.log('✍️ Comentario de asignación agregado con nombre(s)');
        } else if (shouldCreateAssignmentComment) {
          await db.insert(ticketComments).values({
            ticketId,
            userId,
            content: `Ticket asignado a ${body.assignedToIds.length} usuario(s).`,
            isRead: false,
            createdAt: new Date(),
          });

          console.log('✍️ Comentario de asignación agregado (conteo)');
        } else {
          console.log(
            'ℹ️ Asignación automática por defecto: sin comentario en historial.'
          );
        }
      } else {
        console.log('🤷 No hay asignaciones nuevas para agregar');
      }
    }
    const updateData: Partial<UpdateTicketBody> = {
      estado: body.estado,
      tipo: body.tipo,
      email: body.email,
      description: body.description,
      comments: body.comments,
      coverImageKey: body.coverImageKey ?? null,
      videoKey: body.videoKey ?? null,
      documentKey: body.documentKey ?? null,
    };

    const updatedTicket = await db
      .update(tickets)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(tickets.id, ticketId))
      .returning();

    if (isResolvingTicket) {
      await db.insert(ticketComments).values({
        ticketId,
        userId,
        sender: 'support',
        isRead: false,
        content: `Ticket marcado como ${body.estado} por el equipo de soporte.`,
        createdAt: new Date(),
      });

      // 🤖 Si se marca como solucionado, activar IlenIA automáticamente
      if (body.estado === 'solucionado') {
        try {
          const waidMatch = currentTicket.description?.match(/WAID:\s*(\d+)/);
          const waid = waidMatch?.[1];
          if (waid) {
            void fetch(
              'https://n8n.srv1000134.hstgr.cloud/webhook/whatsapp-artiefy-activar-validacion',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ waid }),
              }
            )
              .then((r) =>
                console.log(`[IlenIA] Activada para ${waid} → ${r.status}`)
              )
              .catch((e) => console.error('[IlenIA] Error activando:', e));
          } else {
            console.warn(
              '[IlenIA] No se encontró WAID en descripción del ticket',
              ticketId
            );
          }
        } catch (e) {
          console.error('[IlenIA] Error extrayendo WAID:', e);
        }
      }
    }

    // Si el estado cambió, notificar al estudiante por email y campanita
    if (statusWillChange) {
      try {
        const ticket = await db.query.tickets.findFirst({
          where: eq(tickets.id, ticketId),
          with: { creator: true },
        });

        if (ticket?.creator?.email) {
          // Obtener historial completo ascendente
          const allComments = await db.query.ticketComments.findMany({
            where: eq(ticketComments.ticketId, ticketId),
            with: { user: true },
            orderBy: (comments, { asc }) => [asc(comments.createdAt)],
          });

          const assignmentNoteRegex2 = /^Ticket asignado a \d+ usuario\(s\)\.$/;
          const commentsForEmail = allComments
            .filter((comment) => !assignmentNoteRegex2.test(comment.content))
            .map((comment) => ({
              content: comment.content,
              sender: comment.sender,
              senderName: comment.user?.name ?? 'Usuario',
              createdAt: formatDateColombia(comment.createdAt),
            }));

          const emailHtml = getTicketHistoryEmail(
            ticketId,
            'student',
            ticket.description,
            body.estado ?? ticket.estado,
            commentsForEmail
          );

          const subject = `🔔 Estado de tu Ticket #${ticketId} actualizado a ${body.estado}`;
          const result = await sendTicketEmail({
            to: ticket.creator.email,
            subject,
            html: emailHtml,
          });
          if (result.success) {
            console.log(
              `✅ Email de cambio de estado enviado a ${ticket.creator.email}`
            );
          } else {
            console.error(
              '❌ Error enviando email de cambio de estado:',
              result.error
            );
          }

          // Crear notificación de campanita
          try {
            await db.insert(notifications).values({
              userId: ticket.creatorId,
              type: 'TICKET_STATUS_CHANGED',
              title: '🔔 Estado de tu ticket actualizado',
              message: `Tu Ticket #${ticketId} fue marcado como ${body.estado}.`,
              isRead: false,
              isMarked: false,
              createdAt: new Date(),
              metadata: { ticketId, newStatus: body.estado },
            });
            console.log('✅ Notificación de cambio de estado creada');
          } catch (notifErr) {
            console.error(
              '❌ Error creando notificación de cambio de estado:',
              notifErr
            );
          }
        }
      } catch (notifyError) {
        console.error('❌ Error notificando cambio de estado:', notifyError);
      }
    }

    const comments = await db.query.ticketComments.findMany({
      where: eq(ticketComments.ticketId, ticketId),
      with: { user: true },
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });

    return NextResponse.json({ ...updatedTicket[0], comments });
  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Error updating ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = sessionClaims?.metadata.role;

    if (!userId || (role !== 'admin' && role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    // ❗ Primero elimina los comentarios del ticket
    await db
      .delete(ticketComments)
      .where(eq(ticketComments.ticketId, ticketId));

    // ✅ Luego elimina el ticket
    const deletedTicket = await db
      .delete(tickets)
      .where(eq(tickets.id, ticketId))
      .returning();

    if (!deletedTicket.length) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(deletedTicket[0]);
  } catch (error) {
    console.error('❌ Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Error deleting ticket' },
      { status: 500 }
    );
  }
}
