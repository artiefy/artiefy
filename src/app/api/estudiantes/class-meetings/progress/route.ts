import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { classMeetings, enrollments } from '~/server/db/schema';

export async function POST(req: Request) {
  try {
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

    const meetingIdNumber = Number(meetingId);
    if (isNaN(meetingIdNumber)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Security best practice: verify the caller is enrolled in the meeting's
    // course before mutating it (prevents IDOR against arbitrary meeting rows).
    const meeting = await db.query.classMeetings.findFirst({
      where: eq(classMeetings.id, meetingIdNumber),
      columns: { id: true, courseId: true },
    });
    if (!meeting) {
      return NextResponse.json(
        { error: 'Reunión no encontrada' },
        { status: 404 }
      );
    }

    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, meeting.courseId)
      ),
    });
    if (!enrollment) {
      return NextResponse.json({ error: 'No inscrito' }, { status: 403 });
    }

    await db
      .update(classMeetings)
      .set({ progress })
      .where(eq(classMeetings.id, meetingIdNumber));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
