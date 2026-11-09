/**
 * /api/academia/[slug]/parametros  (super-admin de esa academia)
 *
 * GET — todos los parámetros de evaluación de la academia, para reutilizarlos
 *       en el modal de cursos ("selecciona un parámetro existente").
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { listarParametrosAcademia } from '~/server/academy/parametros';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    return NextResponse.json(await listarParametrosAcademia(academia.id));
  } catch (error) {
    return respuestaDeError(error, 'parametros: listar');
  }
}
