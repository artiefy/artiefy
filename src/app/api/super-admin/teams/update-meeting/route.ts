import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id: number;
      videoUrlExt?: string;
      title?: string;
      weekNumber?: number;
    };

    if (!body.id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    await db
      .update(classMeetings)
      .set({
        ...(body.videoUrlExt !== undefined && {
          videoUrlExt: body.videoUrlExt,
        }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.weekNumber !== undefined && {
          weekNumber: body.weekNumber,
        }),
      })
      .where(eq(classMeetings.id, body.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('❌ update-meeting error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
