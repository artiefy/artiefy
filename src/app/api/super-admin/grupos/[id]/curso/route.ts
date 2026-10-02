/**
 * /api/super-admin/grupos/[id]/curso
 *
 * Matrícula por PERSONA dentro de un grupo (el curso no es del grupo, es de
 * cada estudiante si el operador lo decide).
 *
 * POST   { userId, courseId } — matricula a esa persona en ese curso.
 * DELETE ?userId=&courseId=   — la desmatricula de ese curso.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments } from '~/server/db/schema';

const autorizar = async () => {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  return Boolean(userId) && (role === 'super-admin' || role === 'admin');
};

export async function POST(
  request: NextRequest,
  _ctx: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    userId?: string;
    courseId?: number;
  } | null;
  const userId = body?.userId?.trim();
  const courseId = Number(body?.courseId);
  if (!userId || !Number.isFinite(courseId)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    const existe = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
      )
      .limit(1);

    if (existe.length === 0) {
      await db.insert(enrollments).values({
        userId,
        courseId,
        enrolledAt: new Date(),
        completed: false,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] matricular persona:', error);
    return NextResponse.json(
      { error: 'No se pudo matricular' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  _ctx: { params: Promise<{ id: string }> }
) {
  if (!(await autorizar())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const userId = request.nextUrl.searchParams.get('userId')?.trim();
  const courseId = Number(request.nextUrl.searchParams.get('courseId'));
  if (!userId || !Number.isFinite(courseId)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  try {
    await db
      .delete(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[GRUPOS] desmatricular persona:', error);
    return NextResponse.json(
      { error: 'No se pudo desmatricular' },
      { status: 500 }
    );
  }
}
