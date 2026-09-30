import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getProjectCreationAccess } from '~/server/actions/estudiantes/projects/projectCreationAccess';

/**
 * Lets the UI ask, before opening the creation modal or spending AI calls,
 * whether the learner may create a project. `POST /api/projects` enforces the
 * same rule on its own, so this is a courtesy, not the gate.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        allowed: false,
        reason: 'no-subscription',
        message: 'Inicia sesión para crear proyectos.',
      },
      { status: 401 }
    );
  }

  return NextResponse.json(await getProjectCreationAccess(userId));
}
