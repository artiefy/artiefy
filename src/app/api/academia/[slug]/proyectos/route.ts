/**
 * /api/academia/[slug]/proyectos  (super-admin de esa academia)
 *
 * GET  — proyectos de los estudiantes, con su curso.
 * POST — { titulo, descripcion?, enlace?, courseId, userId } registra un
 *        proyecto de un estudiante matriculado en el curso.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { registrarLog } from '~/server/academy/logs';
import { crearProyecto, listarProyectos } from '~/server/academy/proyectos';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    return NextResponse.json({ proyectos: await listarProyectos(academia.id) });
  } catch (error) {
    return respuestaDeError(error, 'proyectos: listar');
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
    const nuevo = await crearProyecto(academia.id, body);
    await registrarLog(academia.id, 'Proyecto registrado', nuevo.titulo);
    return NextResponse.json({ ok: true, id: nuevo.id }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'proyectos: crear');
  }
}
