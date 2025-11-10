import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { ticketComments } from '~/server/db/schema';

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
      .update((await import('~/server/db/schema')).tickets)
      .set({ updatedAt: new Date() })
      .where(eq((await import('~/server/db/schema')).tickets.id, ticketId));

    return NextResponse.json(newComment[0]);
  } catch (error) {
    console.error('❌ Error creating comment:', error);
    return NextResponse.json(
      { error: 'Error creating comment' },
      { status: 500 }
    );
  }
}
