/**
 * /api/academia/[slug]/correo  (super-admin de esa academia)
 *
 * GET  — { remitenteNombre, correoRespuesta }.
 * PUT  — { remitenteNombre?, correoRespuesta? }: los guarda (sin contraseña;
 *        los correos salen desde Artiefy a nombre de la academia).
 * POST — envía un correo de prueba al correo de respuesta.
 * Límite: 10 pruebas cada 10 minutos por academia.
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
  enviarPrueba,
  guardarCorreo,
  obtenerCorreo,
} from '~/server/academy/correo';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string }> };

const limite = new Ratelimit({
  redis: new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(10, '10 m'),
  prefix: 'academia-prueba-correo',
});

const resolver = async (params: Ctx['params']) =>
  cuentaDeAcademia((await params).slug, ['super-admin']);

const limitar = async (academyId: number) => {
  const { success } = await limite.limit(String(academyId));
  if (!success) {
    throw new ErrorAcademia(
      'Demasiados intentos seguidos. Intenta en unos minutos.',
      429
    );
  }
};

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    return NextResponse.json(await obtenerCorreo(academia.id));
  } catch (error) {
    return respuestaDeError(error, 'correo: ver');
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const correo = await guardarCorreo(academia.id, body);
    await registrarLog(
      academia.id,
      'Correo de la academia actualizado',
      correo.correoRespuesta ?? 'sin correo de respuesta'
    );
    return NextResponse.json(correo);
  } catch (error) {
    return respuestaDeError(error, 'correo: guardar');
  }
}

export async function POST(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    await limitar(academia.id);
    await enviarPrueba(academia);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'correo: prueba');
  }
}
