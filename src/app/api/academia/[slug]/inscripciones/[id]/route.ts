/**
 * /api/academia/[slug]/inscripciones/[id]  (super-admin de esa academia)
 *
 * PATCH  — { estado } (nueva, contactada, inscrita, descartada).
 * DELETE — elimina la respuesta.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  cambiarEstadoInscripcion,
  eliminarInscripcion,
} from '~/server/academy/inscripciones';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as {
      estado?: unknown;
    };
    const detalle = await cambiarEstadoInscripcion(
      academia.id,
      Number(id),
      body.estado
    );
    await registrarLog(academia.id, 'Inscripción actualizada', detalle);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'inscripciones: estado');
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const email = await eliminarInscripcion(academia.id, Number(id));
    await registrarLog(academia.id, 'Inscripción eliminada', email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'inscripciones: eliminar');
  }
}
