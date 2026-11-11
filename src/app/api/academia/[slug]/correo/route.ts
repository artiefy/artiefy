/**
 * /api/academia/[slug]/correo  (super-admin de esa academia)
 *
 * GET    — correo conectado (sin la contraseña) o null.
 * PUT    — { proveedor, usuario, clave?, host?, puerto?, remitenteNombre? }
 *          prueba la conexión y conecta el correo.
 * POST   — envía un correo de prueba al buzón conectado.
 * DELETE — desconecta (vuelven a salir desde el correo de Artiefy).
 * Límite: 10 intentos de conexión o prueba cada 10 minutos por academia.
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
  conectarCorreo,
  desconectarCorreo,
  enviarPrueba,
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
  prefix: 'academia-conectar-correo',
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
    return NextResponse.json({
      correo: await obtenerCorreo(academia.id),
      disponible: Boolean(env.ACADEMY_MAIL_SECRET),
    });
  } catch (error) {
    return respuestaDeError(error, 'correo: ver');
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    await limitar(academia.id);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    await conectarCorreo(academia.id, body);
    const correo = await obtenerCorreo(academia.id);
    await registrarLog(academia.id, 'Correo conectado', correo?.usuario ?? '');
    return NextResponse.json({ ok: true, correo });
  } catch (error) {
    return respuestaDeError(error, 'correo: conectar');
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

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    await desconectarCorreo(academia.id);
    await registrarLog(academia.id, 'Correo desconectado', '');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'correo: desconectar');
  }
}
