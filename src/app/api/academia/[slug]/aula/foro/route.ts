/**
 * /api/academia/[slug]/aula/foro  (cuentas de la academia)
 *
 * GET    ?courseId= — temas y respuestas del foro del curso.
 * POST   { courseId, titulo?, contenido, parentId? } — tema o respuesta.
 * DELETE ?id= — borra un mensaje propio (el personal, cualquiera).
 * Límite: 20 mensajes cada 10 minutos por cuenta.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from '~/env';
import { ErrorAcademia } from '~/server/academy/academias';
import {
  borrarForo,
  listarForo,
  publicarForo,
} from '~/server/academy/aula-curso-extra';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { ACADEMY_ROLES } from '~/server/db/schema';

type Ctx = { params: Promise<{ slug: string }> };

const limite = new Ratelimit({
  redis: new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(20, '10 m'),
  prefix: 'academia-aula-foro',
});

const resolver = async (params: Ctx['params']) =>
  cuentaDeAcademia((await params).slug, ACADEMY_ROLES);

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const courseId = Number(request.nextUrl.searchParams.get('courseId'));
    if (!Number.isInteger(courseId))
      throw new ErrorAcademia('Datos inválidos.');
    return NextResponse.json({
      mensajes: await listarForo(academia.id, courseId),
    });
  } catch (error) {
    return respuestaDeError(error, 'aula: foro');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await resolver(params);
    const { success } = await limite.limit(cuenta.userId);
    if (!success) {
      throw new ErrorAcademia(
        'Demasiados mensajes seguidos. Intenta en unos minutos.',
        429
      );
    }
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const courseId = Number(body.courseId);
    if (!Number.isInteger(courseId))
      throw new ErrorAcademia('Datos inválidos.');
    await publicarForo(academia.id, cuenta, courseId, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'aula: publicar en foro');
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await resolver(params);
    const id = Number(request.nextUrl.searchParams.get('id'));
    if (!Number.isInteger(id)) throw new ErrorAcademia('Datos inválidos.');
    await borrarForo(academia.id, cuenta, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'aula: borrar del foro');
  }
}
