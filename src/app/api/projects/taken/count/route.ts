import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectsTaken } from '~/server/db/schema';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ count: 0 }, { status: 400 });
  }
  try {
    const inscritos = await db
      .select()
      .from(projectsTaken)
      .where(eq(projectsTaken.projectId, Number(projectId)));
    return NextResponse.json({ count: inscritos.length });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
