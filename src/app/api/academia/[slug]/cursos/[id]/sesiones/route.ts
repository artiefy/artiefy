/**
 * /api/academia/[slug]/cursos/[id]/sesiones  (super-admin de esa academia)
 *
 * GET  — clases virtuales programadas del curso.
 * POST — { titulo, inicio, fin (ISO), enlace?, lessonId? } programa una, o
 *        { sesiones: [...] } varias (modal "Agendar Clase": semanas × días).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { crearSesion, listarSesiones } from '~/server/academy/contenido';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    return NextResponse.json({
      sesiones: await listarSesiones(academia.id, Number(id)),
    });
  } catch (error) {
    return respuestaDeError(error, 'sesiones: listar');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { slug, id } = await params;
    const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (Array.isArray(body.sesiones)) {
      const lista = (body.sesiones as unknown[]).slice(0, 100);
      for (const sesion of lista) {
        await crearSesion(
          academia.id,
          Number(id),
          (sesion ?? {}) as Record<string, unknown>
        );
      }
      await registrarLog(
        academia.id,
        'Clases virtuales agendadas',
        `${lista.length} clases · curso #${id}`
      );
      return NextResponse.json(
        { ok: true, creadas: lista.length },
        { status: 201 }
      );
    }
    const nueva = await crearSesion(academia.id, Number(id), body);
    await registrarLog(academia.id, 'Clase virtual programada', nueva.titulo);
    return NextResponse.json({ ok: true, id: nueva.id }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'sesiones: crear');
  }
}
