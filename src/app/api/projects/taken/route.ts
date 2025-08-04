import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectsTaken } from '~/server/db/schema';
import { createTaken } from '~/server/actions/project/taken/createTaken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, projectId } = body;

    if (!userId || !projectId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Verificar si ya está inscrito para evitar duplicados
    const existingEnrollment = await db
      .select()
      .from(projectsTaken)
      .where(
        and(
          eq(projectsTaken.userId, String(userId)),
          eq(projectsTaken.projectId, Number(projectId))
        )
      )
      .limit(1);

    if (existingEnrollment.length > 0) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este proyecto' },
        { status: 400 }
      );
    }

    const result = await createTaken({ userId, projectId: Number(projectId) });
    return NextResponse.json(result, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: 'No se pudo inscribir al proyecto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId, projectId } = body;

    if (!userId || !projectId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    await db
      .delete(projectsTaken)
      .where(
        and(
          eq(projectsTaken.userId, String(userId)),
          eq(projectsTaken.projectId, Number(projectId))
        )
      );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: 'No se pudo renunciar al proyecto' },
      { status: 500 }
    );
  }
}
