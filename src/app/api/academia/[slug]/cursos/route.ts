/**
 * /api/academia/[slug]/cursos
 *
 * GET  — cursos de la academia (super-admin y educadores).
 * POST — crea un curso (super-admin). Cuerpo con los nombres del modal de
 *        cursos de Artiefy: { title, subtitle, description, coverImageKey,
 *        coverVideoCourseKey, categoryid, modalidadesid, nivelid, horario,
 *        espacios, certificationTypeId, instructor, individualPrice,
 *        isActive, visibility }.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  crearCurso,
  listarCursos,
  totalEstudiantesInscritos,
  validarCurso,
} from '~/server/academy/cursos';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
      'educador',
    ]);
    const [cursos, totalEstudiantes] = await Promise.all([
      listarCursos(academia.id),
      totalEstudiantesInscritos(academia.id),
    ]);
    return NextResponse.json({ cursos, totalEstudiantes });
  } catch (error) {
    return respuestaDeError(error, 'cursos: listar');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const datos = await validarCurso(academia.id, body);
    const nuevo = await crearCurso(academia.id, cuenta.userId, datos);
    await registrarLog(academia.id, 'Curso creado', String(body.title ?? ''));
    return NextResponse.json({ ok: true, ...nuevo }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'cursos: crear');
  }
}
