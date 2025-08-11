// src/app/api/enrollments/markComplete/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments } from '~/server/db/schema';

export async function PATCH(req: NextRequest) {
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
