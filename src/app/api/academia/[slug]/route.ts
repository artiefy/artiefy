/**
 * /api/academia/[slug]  (solo super-admin DE ESA academia)
 *
 * PATCH — edita los datos y colores de su propia academia (Configuraciones del
 * inicio). Mismos campos y validación que el panel de Artiefy, salvo
 * `esArtiefy` y `activa`, que solo cambia el super-admin de Artiefy.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  actualizarAcademia,
  validarDatosAcademia,
} from '~/server/academy/academias';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const { esArtiefy: _esArtiefy, ...datos } = validarDatosAcademia(
      body,
      true
    );
    await actualizarAcademia(academia.id, datos);
    await registrarLog(
      academia.id,
      'Configuración actualizada',
      Object.keys(datos).join(', ')
    );
    return NextResponse.json({ ok: true, slug: datos.slug ?? academia.slug });
  } catch (error) {
    return respuestaDeError(error, 'academia: configuraciones');
  }
}
