import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { ticketComments, tickets, users } from '~/server/db/schema';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const ticketIdNum = parseInt(id);

    if (isNaN(ticketIdNum)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    // Verificar que el ticket existe y el usuario tiene acceso
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, ticketIdNum),
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Verificar que el usuario sea el creador o un admin
    const userRole = user.publicMetadata?.role as string | undefined;
    const isAdmin =
      userRole === 'admin' ||
      userRole === 'super-admin' ||
      userRole === 'educador';
    const isCreator = ticket.creatorId === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obtener todos los mensajes del ticket con información del usuario
    const messages = await db
      .select({
        id: ticketComments.id,
        content: ticketComments.content,
        sender: ticketComments.sender,
        createdAt: ticketComments.createdAt,
        userId: ticketComments.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(ticketComments)
      .leftJoin(users, eq(ticketComments.userId, users.id))
      .where(eq(ticketComments.ticketId, ticketIdNum))
      .orderBy(ticketComments.createdAt);

    return NextResponse.json({
      ticketId: ticketIdNum,
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        createdAt: msg.createdAt,
        user: {
          id: msg.userId,
          name: msg.userName ?? 'Usuario',
          email: msg.userEmail ?? '',
        },
      })),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
