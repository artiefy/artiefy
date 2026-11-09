/**
 * /api/academia/[slug]/programas/[id]  (super-admin de esa academia)
 *
 * PATCH  — mismo cuerpo que al crear.
 * DELETE — elimina el programa (los cursos no se tocan).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import {
  actualizarPrograma,
  eliminarPrograma,
} from '~/server/academy/programas';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const titulo = await actualizarPrograma(academia.id, Number(id), body);
    await registrarLog(academia.id, 'Programa editado', titulo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'programas: editar');
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const titulo = await eliminarPrograma(academia.id, Number(id));
    await registrarLog(academia.id, 'Programa eliminado', titulo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'programas: eliminar');
  }
}
