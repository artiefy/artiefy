/**
 * /api/academia/[slug]/aula/opiniones  (cuentas de la academia)
 *
 * GET  ?courseId= — promedio, total y opiniones del curso.
 * POST { courseId, estrellas (1-5), contenido? } — opinión del estudiante
 *      matriculado (una por curso).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { ErrorAcademia } from '~/server/academy/academias';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  listarOpiniones,
  opinarCurso,
} from '~/server/academy/comentarios-aula';
import { ACADEMY_ROLES } from '~/server/db/schema';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia(
      (await params).slug,
      ACADEMY_ROLES
    );
    const courseId = Number(request.nextUrl.searchParams.get('courseId'));
    if (!Number.isInteger(courseId))
      throw new ErrorAcademia('Datos inválidos.');
    return NextResponse.json(await listarOpiniones(academia.id, courseId));
  } catch (error) {
    return respuestaDeError(error, 'aula: opiniones');
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
    await opinarCurso(academia.id, cuenta, courseId, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'aula: opinar');
  }
}
