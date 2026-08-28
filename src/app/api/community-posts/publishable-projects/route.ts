import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getPublishableProjects } from '~/server/actions/project/getPublishableProjects';

// GET /api/community-posts/publishable-projects — projects the signed-in
// user may attach a community publication to (their own, any visibility,
// plus other people's public ones). Backs the post composer's "Buscar
// proyecto..." selector. Auth-gated here rather than calling
// `getPublishableProjects` straight from a client component: that server
// action trusts whatever `userId` it is given, so it must only ever be
// invoked with the caller's own verified session id.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const projects = await getPublishableProjects(userId);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('[community-posts/publishable-projects][GET] error', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}
