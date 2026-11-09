/**
 * /api/academia/[slug]/cursos/[id]/parametros  (super-admin de esa academia)
 *
 * GET — parámetros de evaluación del curso.
 * PUT — [{ name, description, porcentaje, numberOfActivities }] los reemplaza
 *       (suman 100%; lista vacía = el curso no es calificable).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import {
  guardarParametrosCurso,
  listarParametrosCurso,
} from '~/server/academy/parametros';

type Ctx = { params: Promise<{ slug: string; id: string }> };

const resolver = async (params: Ctx['params']) => {
  const { slug, id } = await params;
  const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
  return { academia, courseId: Number(id) };
};

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia, courseId } = await resolver(params);
    return NextResponse.json(
      await listarParametrosCurso(academia.id, courseId)
    );
  } catch (error) {
    return respuestaDeError(error, 'curso: parametros');
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, courseId } = await resolver(params);
    const body: unknown = await request.json().catch(() => []);
    await guardarParametrosCurso(academia.id, courseId, body);
    await registrarLog(
      academia.id,
      'Parámetros de evaluación actualizados',
      `curso #${courseId}`
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'curso: guardar parametros');
  }
}
