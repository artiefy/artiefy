/**
 * DELETE /api/academia/[slug]/sesiones/[sesionId]  (super-admin de esa
 * academia) — elimina una clase virtual programada.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { eliminarSesion } from '~/server/academy/contenido';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; sesionId: string }> };

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, sesionId } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const titulo = await eliminarSesion(academia.id, Number(sesionId));
    await registrarLog(academia.id, 'Clase virtual eliminada', titulo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'sesiones: eliminar');
  }
}
