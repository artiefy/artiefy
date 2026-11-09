/**
 * POST /api/academia/[slug]/matriculas  (super-admin de esa academia)
 *
 * { courseId, userIds[] } matricula estudiantes de la academia en un curso
 * de la academia (Lista de Estudiantes › Matricular a Curso).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { matricularEstudiantes } from '~/server/academy/estudiantes';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const body = (await request.json().catch(() => ({}))) as {
      courseId?: unknown;
      userIds?: unknown;
    };
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.filter((v): v is string => typeof v === 'string')
      : [];
    const nuevas = await matricularEstudiantes(
      academia.id,
      Number(body.courseId),
      userIds
    );
    await registrarLog(
      academia.id,
      'Estudiantes matriculados',
      `${nuevas} en el curso #${String(body.courseId)}`
    );
    return NextResponse.json({ ok: true, matriculados: nuevas });
  } catch (error) {
    return respuestaDeError(error, 'matriculas: crear');
  }
}
