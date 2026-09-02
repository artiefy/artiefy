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
      /** Enlace de la clase. `null` lo borra; omitirlo lo deja intacto. */
      joinUrl?: string | null;
    };

    if (!body.id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    await db
      .update(classMeetings)
      .set({
        // En ambos enlaces se distingue "no enviado" (deja el valor como
        // estaba) de "enviado vacío" (lo borra).
        //
        // `video_url_ext` sí admite null, así que se limpia de verdad.
        ...(body.videoUrlExt !== undefined && {
          videoUrlExt: body.videoUrlExt === '' ? null : body.videoUrlExt,
        }),
        ...(body.title !== undefined && { title: body.title }),
        // `join_url` es NOT NULL en la base (aunque el esquema de Drizzle la
        // declare opcional), así que borrarlo con null revienta con un 23502.
        // Se guarda cadena vacía: la interfaz la trata igual que "sin enlace"
        // y no hace falta alterar la tabla.
        ...(body.joinUrl !== undefined && { joinUrl: body.joinUrl ?? '' }),
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
