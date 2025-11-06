import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import {
  getNewTicketAssignmentEmail,
  sendTicketEmail,
} from '~/lib/emails/ticketEmails';
import { db } from '~/server/db';
import {
  ticketAssignees,
  ticketComments,
  tickets,
  users,
} from '~/server/db/schema';
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
      await db.insert(ticketComments).values({
        ticketId,
        userId,
        sender: 'admin',
        content: body.newComment.trim(),
        createdAt: new Date(),
      });
    }

    if (body.assignedToIds) {
      console.log(
        '🔁 Actualizando asignaciones múltiples:',
        body.assignedToIds
      );

      await db
        .delete(ticketAssignees)
        .where(eq(ticketAssignees.ticketId, ticketId));
      console.log('🧹 Asignaciones anteriores eliminadas');

      if (body.assignedToIds.length > 0) {
        const newAssignments = body.assignedToIds.map((uid) => ({
          ticketId,
          userId: uid,
        }));

        await Promise.all(
          newAssignments.map((a) => db.insert(ticketAssignees).values(a))
        );
        console.log('✅ Nuevas asignaciones insertadas');

        // ✉️ Enviar correos a asignados
        for (const assignedId of body.assignedToIds) {
          try {
            const assignee = await db.query.users.findFirst({
              where: eq(users.id, assignedId),
            });

            if (assignee?.email) {
              console.log('📧 Enviando correo a:', assignee.email);

              const emailResult = await sendTicketEmail({
                to: assignee.email,
                subject: `Nuevo Ticket Asignado #${ticketId}`,
                html: getNewTicketAssignmentEmail(
                  ticketId,
                  body.description ?? currentTicket.description
                ),
              });

              console.log('✅ Email enviado:', emailResult);
            } else {
              console.log(`⚠️ Usuario ${assignedId} no tiene correo`);
            }
          } catch (error) {
            console.error(`❌ Error enviando a ${assignedId}:`, error);
          }
        }

        // 📝 Comentario de asignación automática
        await db.insert(ticketComments).values({
          ticketId,
          userId,
          content: `Ticket asignado a ${body.assignedToIds.length} usuario(s).`,
          createdAt: new Date(),
        });

        console.log('📝 Comentario automático agregado');
      } else {
        console.log('ℹ️ No hay asignaciones nuevas para agregar');
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
        content: `Ticket marcado como ${body.estado} por el equipo de soporte.`,
        createdAt: new Date(),
      });
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
