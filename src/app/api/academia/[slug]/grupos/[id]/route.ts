/**
 * /api/academia/[slug]/grupos/[id]  (super-admin de esa academia)
 *
 * PATCH  — mismo cuerpo que al crear.
 * DELETE — elimina el grupo (las matrículas en el curso se conservan).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { actualizarGrupo, eliminarGrupo } from '~/server/academy/grupos';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const nombre = await actualizarGrupo(academia.id, Number(id), body);
    await registrarLog(academia.id, 'Grupo editado', nombre);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'grupos: editar');
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const nombre = await eliminarGrupo(academia.id, Number(id));
    await registrarLog(academia.id, 'Grupo eliminado', nombre);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'grupos: eliminar');
  }
}
