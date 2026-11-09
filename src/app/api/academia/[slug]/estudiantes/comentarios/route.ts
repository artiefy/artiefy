/**
 * /api/academia/[slug]/estudiantes/comentarios  (super-admin de esa academia)
 *
 * GET  ?userId= — comentarios del estudiante (más recientes primero).
 * POST { userId, texto } — agrega un comentario.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  agregarComentario,
  listarComentarios,
} from '~/server/academy/estudiantes';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { academia } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const userId = request.nextUrl.searchParams.get('userId') ?? '';
    return NextResponse.json({
      comentarios: await listarComentarios(academia.id, userId),
    });
  } catch (error) {
    return respuestaDeError(error, 'comentarios: listar');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { academia, cuenta } = await cuentaDeAcademia((await params).slug, [
      'super-admin',
    ]);
    const body = (await request.json().catch(() => ({}))) as {
      userId?: unknown;
      texto?: unknown;
    };
    await agregarComentario(
      academia.id,
      typeof body.userId === 'string' ? body.userId : '',
      { id: cuenta.userId, nombre: cuenta.name ?? cuenta.email },
      typeof body.texto === 'string' ? body.texto : ''
    );
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'comentarios: agregar');
  }
}
