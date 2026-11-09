/**
 * /api/academia/[slug]/actividades/[activityId]  (super-admin de esa academia)
 *
 * PATCH  — mismo cuerpo que al crear.
 * DELETE — elimina la actividad.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  actualizarActividad,
  eliminarActividad,
} from '~/server/academy/contenido';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; activityId: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, activityId } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const titulo = await actualizarActividad(
      academia.id,
      Number(activityId),
      body
    );
    await registrarLog(academia.id, 'Actividad editada', titulo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'actividades: editar');
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, activityId } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const titulo = await eliminarActividad(academia.id, Number(activityId));
    await registrarLog(academia.id, 'Actividad eliminada', titulo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'actividades: eliminar');
  }
}
