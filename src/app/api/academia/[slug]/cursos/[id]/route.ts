/**
 * /api/academia/[slug]/cursos/[id]  (super-admin de la academia)
 *
 * PATCH  — edita el curso (mismo cuerpo que al crear).
 * DELETE — elimina el curso.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  cuentaDelCurso,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  actualizarCurso,
  eliminarCurso,
  obtenerCurso,
  validarCurso,
} from '~/server/academy/cursos';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia, cuenta } = await cuentaDelCurso(slug, {
      curso: Number(id),
    });
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const datos = await validarCurso(academia.id, body);
    // El educador edita su curso pero no cambia quién lo dicta (eso es del
    // super-admin): se conservan los instructores actuales.
    if (cuenta.role === 'educador') {
      const actual = await obtenerCurso(academia.id, Number(id));
      datos.instructores = actual?.instructores ?? [cuenta.userId];
      datos.instructor = datos.instructores[0] ?? null;
    }
    await actualizarCurso(academia.id, Number(id), datos);
    await registrarLog(academia.id, 'Curso editado', String(body.title ?? id));
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
    await registrarLog(academia.id, 'Curso eliminado', `Curso #${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'cursos: eliminar');
  }
}
