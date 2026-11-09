/**
 * /api/academia/[slug]/programas  (super-admin de esa academia)
 *
 * GET  — programas con sus cursos.
 * POST — { title, description?, isActive?, courseIds[] } crea un programa.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import { crearPrograma, listarProgramas } from '~/server/academy/programas';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    return NextResponse.json({ programas: await listarProgramas(academia.id) });
  } catch (error) {
    return respuestaDeError(error, 'programas: listar');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const nuevo = await crearPrograma(academia.id, body);
    await registrarLog(academia.id, 'Programa creado', nuevo.title);
    return NextResponse.json({ ok: true, id: nuevo.id }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'programas: crear');
  }
}
