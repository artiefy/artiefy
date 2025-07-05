import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { createProject } from '~/server/actions/project/createProject';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = (await req.json()) as unknown as Parameters<
      typeof createProject
    >[0];
    console.log('🟡 Datos recibidos:', body);

    const result = await createProject(body);

    // Si createProject retorna el id, úsalo. Si no, modifícalo para que lo retorne.
    return NextResponse.json({
      message: 'Proyecto creado correctamente',
      id: result?.id,
    });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    return NextResponse.json(
      { error: 'Error al crear el proyecto' },
      { status: 500 }
    );
  }
}
