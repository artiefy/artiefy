/**
 * POST /api/academia/[slug]/aula/entregas  (estudiante de la academia)
 * { activityId, texto?, enlace?, archivoKey?, archivoNombre? } — entrega (o
 * reemplaza) su respuesta a una actividad. Límite: 20 entregas cada 10 min.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from '~/env';
import { ErrorAcademia } from '~/server/academy/academias';
import { entregarActividad } from '~/server/academy/aula';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';

type Ctx = { params: Promise<{ slug: string }> };

const limite = new Ratelimit({
  redis: new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(20, '10 m'),
  prefix: 'academia-aula-entregas',
});

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await cuentaDeAcademia((await params).slug, [
      'estudiante',
    ]);
    const { success } = await limite.limit(cuenta.userId);
    if (!success) {
      throw new ErrorAcademia(
        'Demasiadas entregas seguidas. Intenta en unos minutos.',
        429
      );
    }
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const activityId = Number(body.activityId);
    if (!Number.isInteger(activityId))
      throw new ErrorAcademia('Datos inválidos.');
    const entrega = await entregarActividad(
      academia.id,
      cuenta.userId,
      activityId,
      body
    );
    return NextResponse.json({ entrega });
  } catch (error) {
    return respuestaDeError(error, 'aula: entrega');
  }
}
