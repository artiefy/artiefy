/**
 * POST /api/academia/[slug]/aula/progreso  (estudiante de la academia)
 * { lessonId, progreso (0-100), completar? } — guarda su avance en la clase
 * (nunca baja). Devuelve { progreso, completada }.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { ErrorAcademia } from '~/server/academy/academias';
import { guardarProgreso } from '~/server/academy/aula';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await cuentaDeAcademia((await params).slug, [
      'estudiante',
    ]);
    const body = (await request.json().catch(() => ({}))) as {
      lessonId?: unknown;
      progreso?: unknown;
      completar?: unknown;
    };
    const lessonId = Number(body.lessonId);
    const progreso = Number(body.progreso ?? 0);
    if (!Number.isInteger(lessonId) || !Number.isFinite(progreso)) {
      throw new ErrorAcademia('Datos inválidos.');
    }
    const r = await guardarProgreso(
      academia.id,
      cuenta.userId,
      lessonId,
      progreso,
      body.completar === true
    );
    return NextResponse.json({
      progreso: r.progreso,
      completada: r.completada,
    });
  } catch (error) {
    return respuestaDeError(error, 'aula: progreso');
  }
}
