/**
 * /api/academia/[slug]/cursos/[id]/lecciones  (super-admin de esa academia)
 *
 * GET  — clases del curso (en orden, con su número de actividades).
 * POST — { title, description?, videoUrl?, duracionMin? } crea una clase.
 * PUT  — { orden: number[] } reordena las clases del curso.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  crearLeccion,
  listarLecciones,
  reordenarLecciones,
} from '~/server/academy/contenido';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; id: string }> };

const resolver = async (params: Ctx['params']) => {
  const { slug, id } = await params;
  const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
  return { academia, courseId: Number(id) };
};

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia, courseId } = await resolver(params);
    return NextResponse.json({
      lecciones: await listarLecciones(academia.id, courseId),
    });
  } catch (error) {
    return respuestaDeError(error, 'lecciones: listar');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, courseId } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const nueva = await crearLeccion(academia.id, courseId, body);
    await registrarLog(academia.id, 'Clase creada', nueva.title);
    return NextResponse.json({ ok: true, id: nueva.id }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'lecciones: crear');
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, courseId } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as {
      orden?: unknown;
    };
    await reordenarLecciones(academia.id, courseId, body.orden);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'lecciones: reordenar');
  }
}
