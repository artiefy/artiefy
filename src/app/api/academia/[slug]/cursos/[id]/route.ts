/**
 * /api/academia/[slug]/cursos/[id]  (super-admin de la academia)
 *
 * PATCH  — edita el curso (mismo cuerpo que al crear).
 * DELETE — elimina el curso.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  actualizarCurso,
  eliminarCurso,
  validarCurso,
} from '~/server/academy/cursos';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const datos = await validarCurso(academia.id, body);
    await actualizarCurso(academia.id, Number(id), datos);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'cursos: editar');
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    await eliminarCurso(academia.id, Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'cursos: eliminar');
  }
}
