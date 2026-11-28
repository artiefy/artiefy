/**
 * /api/academia/[slug]/aula/comentarios  (cuentas de la academia)
 *
 * GET    ?lessonId= — comentarios de la clase (con respuestas).
 * POST   { lessonId, contenido, parentId? } — comenta o responde.
 * DELETE ?id= — borra un comentario propio (el personal, cualquiera).
 * Límite: 20 comentarios cada 10 minutos por cuenta.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from '~/env';
import { ErrorAcademia } from '~/server/academy/academias';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  borrarComentarioClase,
  comentarClase,
  listarComentariosClase,
} from '~/server/academy/comentarios-aula';
import { ACADEMY_ROLES } from '~/server/db/schema';

type Ctx = { params: Promise<{ slug: string }> };

const limite = new Ratelimit({
  redis: new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(20, '10 m'),
  prefix: 'academia-aula-comentarios',
});

const resolver = async (params: Ctx['params']) =>
  cuentaDeAcademia((await params).slug, ACADEMY_ROLES);

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const lessonId = Number(request.nextUrl.searchParams.get('lessonId'));
    if (!Number.isInteger(lessonId))
      throw new ErrorAcademia('Datos inválidos.');
    return NextResponse.json({
      comentarios: await listarComentariosClase(academia.id, lessonId),
    });
  } catch (error) {
    return respuestaDeError(error, 'aula: comentarios');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await resolver(params);
    const { success } = await limite.limit(cuenta.userId);
    if (!success) {
      throw new ErrorAcademia(
        'Demasiados comentarios seguidos. Intenta en unos minutos.',
        429
      );
    }
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const lessonId = Number(body.lessonId);
    if (!Number.isInteger(lessonId))
      throw new ErrorAcademia('Datos inválidos.');
    await comentarClase(academia.id, cuenta, lessonId, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'aula: comentar');
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await resolver(params);
    const id = Number(request.nextUrl.searchParams.get('id'));
    if (!Number.isInteger(id)) throw new ErrorAcademia('Datos inválidos.');
    await borrarComentarioClase(academia.id, cuenta, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'aula: borrar comentario');
  }
}
