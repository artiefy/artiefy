import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
    // Verificar autenticación - properly await the auth() call
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { meetingId, progress } = body;

    if (
      !meetingId ||
      typeof progress !== 'number' ||
      progress < 0 ||
      progress > 100
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Ensure meetingId is treated as a number
    const meetingIdNumber = Number(meetingId);

    // Actualizar el progreso en la base de datos
    await db
      .update(classMeetings)
      .set({ progress })
      .where(eq(classMeetings.id, meetingIdNumber));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
