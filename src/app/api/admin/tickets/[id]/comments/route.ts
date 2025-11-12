import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import {
  getTicketHistoryEmail,
  sendTicketEmail,
} from '~/lib/emails/ticketEmails';
import { formatDateColombia } from '~/lib/formatDate';
import { db } from '~/server/db';
import { notifications, ticketComments, tickets } from '~/server/db/schema';

// Tipos seguros
interface CreateCommentBody {
  content: string;
}

// ========================
// GET /api/admin/tickets/[id]/comments
// ========================
export async function GET(
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

    const comments = await db.query.ticketComments.findMany({
      where: eq(ticketComments.ticketId, ticketId),
      with: {
        user: true,
      },
      orderBy: (comments, { desc }) => [desc(comments.createdAt)],
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Error fetching comments' },
      { status: 500 }
    );
  }
}

// ========================
// POST /api/admin/tickets/[id]/comments
// ========================
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata.role;

  if (!userId || (role !== 'admin' && role !== 'super-admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const body = (await request.json()) as CreateCommentBody;
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const newComment = await db
      .insert(ticketComments)
      .values({
        ticketId,
        userId,
        sender: role === 'super-admin' ? 'admin' : 'admin', // Ambos se marcan como 'admin' en el chatbot
        content,
        isRead: false, // El estudiante no ha leído este mensaje aún
        createdAt: new Date(),
      })
      .returning();

    // Actualizar la fecha de actualización del ticket cuando hay nuevo comentario
    await db
      .update(tickets)
      .set({ updatedAt: new Date() })
      .where(eq(tickets.id, ticketId));

    // Obtener información del ticket y su creador para enviar email
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, ticketId),
      with: {
        creator: true,
      },
    });

    if (ticket?.creator?.email) {
      // Obtener historial completo de comentarios para el email
      const allComments = await db.query.ticketComments.findMany({
        where: eq(ticketComments.ticketId, ticketId),
        with: {
          user: true,
        },
        orderBy: (comments, { asc }) => [asc(comments.createdAt)],
      });

      // Filtrar mensaje automático de asignación: "Ticket asignado a X usuario(s)."
      const assignmentNoteRegex = /^Ticket asignado a \d+ usuario\(s\)\.$/;
      const commentsForEmail = allComments
        .filter((comment) => !assignmentNoteRegex.test(comment.content))
        .map((comment) => ({
          content: comment.content,
          sender: comment.sender,
          senderName: comment.user?.name ?? 'Usuario',
          createdAt: formatDateColombia(comment.createdAt),
        }));

      // Enviar email al estudiante con el historial
      const emailHtml = getTicketHistoryEmail(
        ticketId,
        'student',
        ticket.description,
        ticket.estado,
        commentsForEmail
      );

      void sendTicketEmail({
        to: ticket.creator.email,
        subject: `📬 Nueva respuesta en tu Ticket #${ticketId}`,
        html: emailHtml,
      }).then((result) => {
        if (result.success) {
          console.log(
            `✅ Email de notificación enviado al estudiante: ${ticket.creator.email}`
          );
        } else {
          console.error(`❌ Error enviando email al estudiante:`, result.error);
        }
      });

      // Crear notificación en la campanita del estudiante
      try {
        await db.insert(notifications).values({
          userId: ticket.creatorId,
          type: 'TICKET_REPLY',
          title: '💬 Nueva respuesta en tu ticket',
          message: `El administrador ha respondido a tu Ticket #${ticketId}. Haz clic para ver la respuesta.`,
          isRead: false,
          isMarked: false,
          createdAt: new Date(),
          metadata: {
            ticketId: ticketId,
          },
        });
        console.log(
          `✅ Notificación creada para el estudiante: ${ticket.creator.email}`
        );
      } catch (notifError) {
        console.error('❌ Error creando notificación:', notifError);
      }
    }

    return NextResponse.json(newComment[0]);
  } catch (error) {
    console.error('❌ Error creating comment:', error);
    return NextResponse.json(
      { error: 'Error creating comment' },
      { status: 500 }
    );
  }
}
