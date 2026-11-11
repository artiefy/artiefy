/**
 * /api/academia/[slug]/ajustes  (super-admin de esa academia)
 *
 * GET   — favicon y ajustes del formulario de inscripción.
 * PATCH — { faviconKey?, formularioLogos?, formularioFechas?,
 *           formularioComerciales? } (keys de S3 subidas con /api/upload).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { guardarAjustes, obtenerAjustes } from '~/server/academy/ajustes';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string }> };

const resolver = async (params: Ctx['params']) =>
  cuentaDeAcademia((await params).slug, ['super-admin']);

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    return NextResponse.json(await obtenerAjustes(academia.id));
  } catch (error) {
    return respuestaDeError(error, 'ajustes: ver');
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    await guardarAjustes(academia.id, body);
    await registrarLog(
      academia.id,
      'Ajustes actualizados',
      Object.keys(body).join(', ')
    );
    return NextResponse.json(await obtenerAjustes(academia.id));
  } catch (error) {
    return respuestaDeError(error, 'ajustes: guardar');
  }
}
