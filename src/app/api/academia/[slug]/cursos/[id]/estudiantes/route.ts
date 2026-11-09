/**
 * /api/academia/[slug]/cursos/[id]/estudiantes  (super-admin de esa academia)
 *
 * GET    — estudiantes matriculados con sus notas y las actividades del curso.
 * PUT    — { activityId, userId, nota | null } guarda (o borra) una nota.
 * PATCH  — { userIds[], completed } marca o desmarca el curso como completo.
 * DELETE ?userId= — quita al estudiante del curso (y sus notas).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  estudiantesDelCurso,
  guardarNota,
  marcarCompletado,
  quitarDelCurso,
} from '~/server/academy/contenido';
import { registrarLog } from '~/server/academy/logs';

type Ctx = { params: Promise<{ slug: string; id: string }> };

const resolver = async (params: Ctx['params']) => {
  const { slug, id } = await params;
  const { academia } = await cuentaDeAcademia(slug, ['super-admin']);
  return { academia, courseId: Number(id) };
};

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { academia, courseId } = await resolver(params);
    return NextResponse.json(await estudiantesDelCurso(academia.id, courseId));
  } catch (error) {
    return respuestaDeError(error, 'curso: estudiantes');
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, courseId } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    await guardarNota(academia.id, courseId, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'curso: nota');
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, courseId } = await resolver(params);
    const body = (await request.json().catch(() => ({}))) as {
      userIds?: unknown;
      completed?: unknown;
    };
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.filter((v): v is string => typeof v === 'string')
      : [];
    await marcarCompletado(
      academia.id,
      courseId,
      userIds,
      body.completed === true
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'curso: completados');
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, courseId } = await resolver(params);
    const userId = request.nextUrl.searchParams.get('userId') ?? '';
    await quitarDelCurso(academia.id, courseId, userId);
    await registrarLog(
      academia.id,
      'Estudiante quitado del curso',
      `${userId} · curso #${courseId}`
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'curso: quitar estudiante');
  }
}
