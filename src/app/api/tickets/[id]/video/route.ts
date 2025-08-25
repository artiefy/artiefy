import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { tickets } from '~/server/db/schema';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata.role;

  if (!userId || (role !== 'admin' && role !== 'super-admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ticketId = parseInt(params.id);
  if (isNaN(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
  }

  try {
    const { videoKey } = (await req.json()) as { videoKey: string };

    await db
      .update(tickets)
      .set({
        videoKey,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating videoKey:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
