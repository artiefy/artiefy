// src/app/api/enrollments/markComplete/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments } from '~/server/db/schema';
import { authorizeStaff } from '~/server/utils/apiAuth';

export async function PATCH(req: NextRequest) {
  // Security best practice: bulk course-completion is a staff action.
  const authz = await authorizeStaff();
  if (!authz.ok) {
    return NextResponse.json(
      { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
      { status: authz.status }
    );
  }

  const { userIds, courseId }: { userIds: string[]; courseId: number } =
    await req.json();

  if (!userIds?.length || !courseId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  await db
    .update(enrollments)
    .set({ completed: true })
    .where(
      and(
        eq(enrollments.courseId, courseId),
        inArray(enrollments.userId, userIds)
      )
    );

  return NextResponse.json({ ok: true });
}
