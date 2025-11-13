import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { ticketComments } from '~/server/db/schema';

/**
 * POST /api/admin/tickets/[id]/mark-ticket-read
 * Marca todos los mensajes del estudiante (sender='user') como leídos
 * Se invoca cuando el admin abre el modal de detalles o edición del ticket
 */
export async function POST(
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

    // Marcar todos los mensajes del estudiante (sender='user') como leídos
    await db
      .update(ticketComments)
      .set({ isRead: true })
      .where(
        and(
          eq(ticketComments.ticketId, ticketId),
          eq(ticketComments.sender, 'user'),
          eq(ticketComments.isRead, false)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error marking ticket as read:', error);
    return NextResponse.json(
      { error: 'Error marking ticket as read' },
      { status: 500 }
    );
  }
}
