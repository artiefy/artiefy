/**
 * /api/academia/[slug]/formulario  (PÚBLICO: formulario de inscripción)
 *
 * GET  — opciones del formulario (fechas de inicio, comerciales, horarios y
 *        sedes), con la forma de /api/super-admin/form-inscription.
 * POST — envía la inscripción (los campos del formulario de Artiefy): crea
 *        o vincula la cuenta como estudiante, guarda sus datos y la matricula
 *        en el programa. Limitado a 5 envíos por IP cada 10 minutos.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from '~/env';
import { academiaPorSlug } from '~/server/academy/academias';
import { configuracionFormulario } from '~/server/academy/ajustes';
import { respuestaDeError } from '~/server/academy/autorizacion';
import { inscribirDesdeFormulario } from '~/server/academy/formulario';

type Ctx = { params: Promise<{ slug: string }> };

const ratelimit = new Ratelimit({
  redis: new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'academia:formulario',
});

const academiaActiva = async (params: Ctx['params']) => {
  const academia = await academiaPorSlug((await params).slug);
  return academia?.activa ? academia : null;
};

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const academia = await academiaActiva(params);
    if (!academia) {
      return NextResponse.json(
        { error: 'Academia no encontrada' },
        { status: 404 }
      );
    }
    const { config } = await configuracionFormulario(academia.id);
    return NextResponse.json(config);
  } catch (error) {
    return respuestaDeError(error, 'formulario: opciones');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const academia = await academiaActiva(params);
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
    return NextResponse.json(await inscribirDesdeFormulario(academia, body));
  } catch (error) {
    return respuestaDeError(error, 'formulario: inscribir');
  }
}
