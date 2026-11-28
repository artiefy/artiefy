/**
 * GET /api/academia/[slug]/aula/buscar?q=  (cuentas de la academia)
 * Cursos, programas y clases (de sus cursos) que coinciden con la búsqueda.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { buscarAula } from '~/server/academy/aula-barra';
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
    const q = (request.nextUrl.searchParams.get('q') ?? '').slice(0, 100);
    return NextResponse.json(
      await buscarAula(
        academia.id,
        cuenta.userId,
        q,
        cuenta.role !== 'estudiante'
      )
    );
  } catch (error) {
    return respuestaDeError(error, 'aula: buscar');
  }
}
