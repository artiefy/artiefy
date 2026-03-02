import { NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectsTaken } from '~/server/db/schema';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');
  if (!userId || !projectId) {
    return NextResponse.json(
      { taken: false, isInvited: false },
      { status: 400 }
    );
  }
  try {
    const taken = await db
      .select()
      .from(projectsTaken)
      .where(
        and(
          eq(projectsTaken.userId, userId),
          eq(projectsTaken.projectId, Number(projectId))
        )
      )
      .limit(1);

    const isTaken = taken.length > 0;
    const isInvited = isTaken ? (taken[0]?.isInvited ?? false) : false;

    return NextResponse.json({ taken: isTaken, isInvited });
  } catch {
    return NextResponse.json(
      { taken: false, isInvited: false },
      { status: 500 }
    );
  }
}
