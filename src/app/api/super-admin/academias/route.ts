/**
 * /api/super-admin/academias  (solo super-admin de Artiefy)
 *
 * GET  — lista de academias con su número de cuentas.
 * POST — crea una academia { slug, nombre, acronimo, tipo, documentoTipo,
 *        documentoNumero, esArtiefy, logoKey?, colorPrimario?, colorFondo? }.
 */

import { NextResponse } from 'next/server';

import {
  crearAcademia,
  type DatosAcademia,
  listarAcademias,
  validarDatosAcademia,
} from '~/server/academy/academias';
import {
  esSuperAdminArtiefy,
  respuestaDeError,
} from '~/server/academy/autorizacion';

export async function GET() {
  if (!(await esSuperAdminArtiefy())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    return NextResponse.json({ academias: await listarAcademias() });
  } catch (error) {
    return respuestaDeError(error, 'listar');
  }
}

export async function POST(request: Request) {
  const userId = await esSuperAdminArtiefy();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const datos = validarDatosAcademia(body) as DatosAcademia;
    const nueva = await crearAcademia(datos, userId);
    return NextResponse.json({ ok: true, ...nueva }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'crear');
  }
}
