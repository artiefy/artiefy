/**
 * /api/academia/[slug]/grupos  (super-admin de esa academia)
 *
 * GET  — grupos con su curso y estudiantes.
 * POST — { nombre, courseId?, userIds[] } crea un grupo (matricula a sus
 *        estudiantes en el curso, si tiene).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { crearGrupo, listarGrupos } from '~/server/academy/grupos';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    return NextResponse.json({ grupos: await listarGrupos(academia.id) });
  } catch (error) {
    return respuestaDeError(error, 'grupos: listar');
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
    const nuevo = await crearGrupo(academia.id, body);
    await registrarLog(academia.id, 'Grupo creado', nuevo.nombre);
    return NextResponse.json({ ok: true, id: nuevo.id }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'grupos: crear');
  }
}
