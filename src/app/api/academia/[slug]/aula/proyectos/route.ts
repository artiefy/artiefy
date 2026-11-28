/**
 * /api/academia/[slug]/aula/proyectos  (estudiante de la academia)
 *
 * GET  ?courseId= — sus proyectos en el curso.
 * POST { id?, courseId, titulo, descripcion?, enlace?, entregar? } — crea o
 *      edita su proyecto (entregar: true lo marca "entregado").
 */

import { type NextRequest, NextResponse } from 'next/server';

import { ErrorAcademia } from '~/server/academy/academias';
import {
  guardarProyecto,
  misProyectos,
} from '~/server/academy/aula-curso-extra';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { ACADEMY_ROLES } from '~/server/db/schema';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await cuentaDeAcademia(
      (await params).slug,
      ACADEMY_ROLES
    );
    const courseId = Number(request.nextUrl.searchParams.get('courseId'));
    if (!Number.isInteger(courseId))
      throw new ErrorAcademia('Datos inválidos.');
    return NextResponse.json({
      proyectos: await misProyectos(academia.id, cuenta.userId, courseId),
    });
  } catch (error) {
    return respuestaDeError(error, 'aula: proyectos');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await cuentaDeAcademia(
      (await params).slug,
      ACADEMY_ROLES
    );
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const courseId = Number(body.courseId);
    if (!Number.isInteger(courseId))
      throw new ErrorAcademia('Datos inválidos.');
    await guardarProyecto(academia.id, cuenta, courseId, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'aula: guardar proyecto');
  }
}
