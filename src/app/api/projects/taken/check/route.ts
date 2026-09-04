import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectsTaken } from '~/server/db/schema';

/**
 * ¿Está esta persona inscrita/invitada a este proyecto?
 *
 * El `userId` sale SIEMPRE de la sesión, nunca de la query string. Antes se
 * leía del parámetro y se consultaba sin más, así que cualquiera podía
 * averiguar si un usuario cualquiera estaba invitado a un proyecto cualquiera
 * — una fuga de quién pertenece a qué. El parámetro se sigue aceptando por
 * compatibilidad con `ProjectDetailView`, pero solo para rechazarlo cuando no
 * coincide con quien pregunta.
 *
 * La forma de la respuesta (`{ taken, isInvited }`) no cambia.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId');
  const projectId = searchParams.get('projectId');

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { taken: false, isInvited: false },
      { status: 401 }
    );
  }

  if (requestedUserId && requestedUserId !== userId) {
    return NextResponse.json(
      { taken: false, isInvited: false },
      { status: 403 }
    );
  }

  const numericProjectId = Number(projectId);
  if (!projectId || !Number.isFinite(numericProjectId)) {
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
          eq(projectsTaken.projectId, Math.trunc(numericProjectId))
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
