/**
 * /api/academia/[slug]/lecciones/[lessonId]  (super-admin de esa academia)
 *
 * GET    — la clase con su curso y actividades.
 * PATCH  — { title, description?, videoUrl?, duracionMin? }
 * DELETE — elimina la clase (y sus actividades).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { ErrorAcademia } from '~/server/academy/academias';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  actualizarLeccion,
  eliminarLeccion,
  obtenerLeccion,
} from '~/server/academy/contenido';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; lessonId: string }> };

const resolver = async (params: Ctx['params']) => {
  const { slug, lessonId } = await params;
  const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
  return { academia, lessonId: Number(lessonId) };
};

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia, lessonId } = await resolver(params);
    const leccion = await obtenerLeccion(academia.id, lessonId);
    if (!leccion) throw new ErrorAcademia('Clase no encontrada', 404);
    return NextResponse.json({ leccion });
  } catch (error) {
    return respuestaDeError(error, 'lecciones: detalle');
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, lessonId } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const titulo = await actualizarLeccion(academia.id, lessonId, body);
    await registrarLog(academia.id, 'Clase editada', titulo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'lecciones: editar');
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia, lessonId } = await resolver(params);
    const titulo = await eliminarLeccion(academia.id, lessonId);
    await registrarLog(academia.id, 'Clase eliminada', titulo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'lecciones: eliminar');
  }
}
