import { NextResponse } from 'next/server';

import { getProjectById } from '~/server/actions/project/getProjectById';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    if (!idParam) {
      return NextResponse.json(
        { error: 'ID de proyecto requerido' },
        { status: 400 }
      );
    }
    const projectId = Number(idParam);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const project = await getProjectById(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    return NextResponse.json(
      { error: 'Error al obtener el proyecto' },
      { status: 500 }
    );
  }
}
