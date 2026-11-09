/**
 * /api/academia/[slug]/proyectos/[id]  (super-admin de esa academia)
 *
 * PATCH  — { estado } (en progreso, entregado, aprobado).
 * DELETE — elimina el proyecto.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import {
  cambiarEstadoProyecto,
  eliminarProyecto,
} from '~/server/academy/proyectos';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as {
      estado?: unknown;
    };
    const detalle = await cambiarEstadoProyecto(
      academia.id,
      Number(id),
      body.estado
    );
    await registrarLog(academia.id, 'Proyecto actualizado', detalle);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'proyectos: estado');
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const titulo = await eliminarProyecto(academia.id, Number(id));
    await registrarLog(academia.id, 'Proyecto eliminado', titulo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'proyectos: eliminar');
  }
}
