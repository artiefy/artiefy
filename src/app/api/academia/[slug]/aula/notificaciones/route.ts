/**
 * GET /api/academia/[slug]/aula/notificaciones  (cuentas de la academia)
 * Notificaciones del estudiante: clases nuevas y en vivo de sus cursos, sus
 * notas y respuestas a sus comentarios (últimas 3 semanas).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { notificacionesAula } from '~/server/academy/aula-barra';
import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { ACADEMY_ROLES } from '~/server/db/schema';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await cuentaDeAcademia(
      (await params).slug,
      ACADEMY_ROLES
    );
    return NextResponse.json({
      notificaciones: await notificacionesAula(
        academia.id,
        cuenta.userId,
        cuenta.role !== 'estudiante'
      ),
    });
  } catch (error) {
    return respuestaDeError(error, 'aula: notificaciones');
  }
}
