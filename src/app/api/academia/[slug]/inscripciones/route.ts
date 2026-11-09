/**
 * /api/academia/[slug]/inscripciones
 *
 * GET  — respuestas del formulario (super-admin de esa academia).
 * POST — PÚBLICO: { nombre, email, telefono?, documento?, courseId?,
 *        mensaje? } desde <slug>.artiefy.com/inscripcion. Limitado por IP.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from '~/env';
import { academiaPorSlug } from '~/server/academy/academias';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  listarInscripciones,
  recibirInscripcion,
} from '~/server/academy/inscripciones';

type Ctx = { params: Promise<{ slug: string }> };

// Formulario público: 5 envíos por IP cada 10 minutos.
const ratelimit = new Ratelimit({
  redis: new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'academia:inscripcion',
});

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    return NextResponse.json({
      inscripciones: await listarInscripciones(academia.id),
    });
  } catch (error) {
    return respuestaDeError(error, 'inscripciones: listar');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const academia = await academiaPorSlug((await params).slug);
    if (!academia) {
      return NextResponse.json(
        { error: 'Academia no encontrada' },
        { status: 404 }
      );
    }
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'desconocida';
    const { success } = await ratelimit.limit(`${academia.id}:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Demasiados envíos. Intenta de nuevo en unos minutos.' },
        { status: 429 }
      );
    }
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    await recibirInscripcion(academia.id, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'inscripciones: recibir');
  }
}
