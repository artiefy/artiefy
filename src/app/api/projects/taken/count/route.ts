import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectsTaken, projects } from '~/server/db/schema';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ count: 0 }, { status: 400 });
  }
  try {
    // Contar integrantes inscritos
    const inscritos = await db
      .select()
      .from(projectsTaken)
      .where(eq(projectsTaken.projectId, Number(projectId)));

    // Verificar si existe el proyecto (cuenta como +1 por el responsable)
    const proyecto = await db
      .select()
      .from(projects)
      .where(eq(projects.id, Number(projectId)))
      .limit(1);

    const totalCount = inscritos.length + (proyecto.length > 0 ? 1 : 0);

    return NextResponse.json({ count: totalCount });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
