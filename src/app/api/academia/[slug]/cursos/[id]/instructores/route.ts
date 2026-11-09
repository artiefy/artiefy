/**
 * /api/academia/[slug]/cursos/[id]/instructores  (super-admin de esa academia)
 *
 * PUT — { instructors: string[] } reemplaza los instructores del curso (el
 *       primero es el principal; al menos uno).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { actualizarInstructores } from '~/server/academy/cursos';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body: unknown = await request.json().catch(() => ({}));
    await actualizarInstructores(academia.id, Number(id), body);
    await registrarLog(
      academia.id,
      'Instructores del curso actualizados',
      `curso #${id}`
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'curso: instructores');
  }
}
