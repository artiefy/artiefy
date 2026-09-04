/**
 * POST /api/acceso/foto-referencia
 *
 * Guarda la foto contra la que se compararán los rostros en el control de
 * acceso. Se sube a S3 y su clave queda en `users.profileImageKey`, que es de
 * donde ya lee la verificación facial.
 *
 * Recibe la imagen como data URL porque viene de un fotograma de la cámara,
 * no de un archivo del disco.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { uploadMediaToS3 } from '~/server/lib/s3-upload';

const cuerpoSchema = z.object({
  userId: z.string().min(1),
  /** data:image/jpeg;base64,... */
  imagen: z.string().startsWith('data:image/'),
});

/** Límite generoso para una foto de cara; evita subidas absurdas. */
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * GET /api/acceso/foto-referencia?userId=...
 *
 * Devuelve la foto biométrica actual de una persona (clave y URL pública) para
 * mostrarla en el modal de subida antes de reemplazarla.
 */
export async function GET(request: NextRequest) {
  const { userId: operador, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  if (!operador || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const persona = request.nextUrl.searchParams.get('userId');
  if (!persona) {
    return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
  }

  const [fila] = await db
    .select({ key: users.profileImageKey })
    .from(users)
    .where(eq(users.id, persona))
    .limit(1);

  const key = fila?.key ?? null;
  const url = key
    ? key.startsWith('http')
      ? key
      : `https://s3.us-east-2.amazonaws.com/artiefy-upload/${key}`
    : null;

  return NextResponse.json({ key, url });
}

export async function POST(request: NextRequest) {
  const { userId: operador, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');

  // Cambiar la foto de referencia de otra persona decide quién puede entrar
  // por esa puerta: queda restringido a quien administra.
  if (!operador || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const datos = cuerpoSchema.safeParse(await request.json());
  if (!datos.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { userId: persona, imagen } = datos.data;

  try {
    const coma = imagen.indexOf(',');
    const tipo = imagen.slice(5, imagen.indexOf(';'));
    const binario = Buffer.from(imagen.slice(coma + 1), 'base64');

    if (binario.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: 'La imagen es demasiado grande' },
        { status: 413 }
      );
    }

    const archivo = new File(
      [new Uint8Array(binario)],
      `rostro-${persona}.jpg`,
      {
        type: tipo,
      }
    );

    const { key, url } = await uploadMediaToS3(archivo, 'image', persona);

    await db
      .update(users)
      .set({ profileImageKey: key })
      .where(eq(users.id, persona));

    return NextResponse.json({ ok: true, key, url });
  } catch (error) {
    console.error('[FACIAL] no se pudo guardar la foto de referencia:', error);
    return NextResponse.json(
      { error: 'No se pudo guardar la foto' },
      { status: 500 }
    );
  }
}
