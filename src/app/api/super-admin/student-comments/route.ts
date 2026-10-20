/**
 * /api/super-admin/student-comments
 *
 * Comentarios por estudiante (no ligados a grupos). Cada comentario puede tener
 * respuestas (parentId).
 *
 * GET    ?studentId= — lista los comentarios del estudiante.
 * POST   { studentId, content, parentId? } — crea un comentario o respuesta.
 * DELETE ?id=        — elimina un comentario (y sus respuestas directas).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { asc, eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '~/server/db';
import { studentComments, users } from '~/server/db/schema';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return {
    ok: Boolean(userId) && (role === 'super-admin' || role === 'admin'),
    userId,
  };
};

export async function GET(request: NextRequest) {
  const a = await autorizar();
  if (!a.ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const studentId = (
    request.nextUrl.searchParams.get('studentId') ?? ''
  ).trim();
  if (!studentId) {
    return NextResponse.json({ error: 'Falta studentId' }, { status: 400 });
  }

  try {
    const author = alias(users, 'author');
    const comentarios = await db
      .select({
        id: studentComments.id,
        parentId: studentComments.parentId,
        content: studentComments.content,
        createdAt: studentComments.createdAt,
        authorId: studentComments.authorId,
        authorName: author.name,
      })
      .from(studentComments)
      .leftJoin(author, eq(studentComments.authorId, author.id))
      .where(eq(studentComments.studentId, studentId))
      .orderBy(asc(studentComments.createdAt));

    return NextResponse.json({ comentarios });
  } catch (error) {
    console.error('[student-comments] GET:', error);
    return NextResponse.json(
      { error: 'Error al cargar los comentarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const a = await autorizar();
  if (!a.ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    studentId?: string;
    content?: string;
    parentId?: number | null;
  } | null;

  const studentId = body?.studentId?.trim();
  const content = body?.content?.trim();
  const parentId = typeof body?.parentId === 'number' ? body.parentId : null;

  if (!studentId || !content) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    const [inserted] = await db
      .insert(studentComments)
      .values({ studentId, authorId: a.userId ?? null, parentId, content })
      .returning({
        id: studentComments.id,
        createdAt: studentComments.createdAt,
      });

    return NextResponse.json({
      ok: true,
      id: inserted?.id,
      createdAt: inserted?.createdAt,
    });
  } catch (error) {
    console.error('[student-comments] POST:', error);
    return NextResponse.json(
      { error: 'No se pudo guardar el comentario' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const a = await autorizar();
  if (!a.ok) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const id = Number(request.nextUrl.searchParams.get('id'));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Id inválido' }, { status: 400 });
  }

  try {
    // Borra el comentario y sus respuestas directas.
    await db
      .delete(studentComments)
      .where(or(eq(studentComments.id, id), eq(studentComments.parentId, id)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[student-comments] DELETE:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar el comentario' },
      { status: 500 }
    );
  }
}
