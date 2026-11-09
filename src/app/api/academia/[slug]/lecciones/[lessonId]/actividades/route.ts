/**
 * POST /api/academia/[slug]/lecciones/[lessonId]/actividades
 * (super-admin de esa academia)
 *
 * { title, description?, tipo (tarea|quiz|proyecto), fechaLimite?, puntaje? }
 * crea una actividad en la clase.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { crearActividad } from '~/server/academy/contenido';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; lessonId: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, lessonId } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const nueva = await crearActividad(academia.id, Number(lessonId), body);
    await registrarLog(academia.id, 'Actividad creada', nueva.title);
    return NextResponse.json({ ok: true, id: nueva.id }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'actividades: crear');
  }
}
