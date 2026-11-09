/**
 * POST /api/academia/[slug]/estudiantes/correo  (super-admin de esa academia)
 *
 * { userIds[], asunto, mensaje } envía un correo a los estudiantes elegidos,
 * a nombre de la academia. Límite: 10 envíos cada 10 minutos por academia.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { and, eq, inArray } from 'drizzle-orm';

import { env } from '~/env';
import { ErrorAcademia } from '~/server/academy/academias';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import { enviarCorreoAcademia } from '~/server/academy/usuarios';
import { db } from '~/server/db';
import { academyUsers } from '~/server/db/schema';

type Ctx = { params: Promise<{ slug: string }> };

const limite = new Ratelimit({
  redis: new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(10, '10 m'),
  prefix: 'academia-correo',
});

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const body = (await request.json().catch(() => ({}))) as {
      userIds?: unknown;
      asunto?: unknown;
      mensaje?: unknown;
    };
    const asunto = (typeof body.asunto === 'string' ? body.asunto : '')
      .trim()
      .slice(0, 200);
    const mensaje = (typeof body.mensaje === 'string' ? body.mensaje : '')
      .trim()
      .slice(0, 5000);
    if (!asunto || !mensaje) {
      throw new ErrorAcademia('Escribe el asunto y el mensaje.');
    }
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.filter((v): v is string => typeof v === 'string')
      : [];
    const destinos = userIds.length
      ? await db
          .select({ email: academyUsers.email })
          .from(academyUsers)
          .where(
            and(
              eq(academyUsers.academyId, academia.id),
              inArray(academyUsers.userId, userIds)
            )
          )
      : [];
    if (destinos.length === 0) {
      throw new ErrorAcademia('Selecciona a quién enviar el correo.');
    }
    const { success } = await limite.limit(String(academia.id));
    if (!success) {
      throw new ErrorAcademia(
        'Demasiados envíos seguidos. Intenta en unos minutos.',
        429
      );
    }
    const enviados = await enviarCorreoAcademia(
      academia,
      destinos.map((d) => d.email),
      asunto,
      mensaje
    );
    await registrarLog(
      academia.id,
      'Correo enviado a estudiantes',
      `${asunto} (${enviados} de ${destinos.length})`
    );
    return NextResponse.json({ ok: true, enviados, total: destinos.length });
  } catch (error) {
    return respuestaDeError(error, 'estudiantes: correo');
  }
}
