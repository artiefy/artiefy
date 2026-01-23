import { NextResponse } from 'next/server';

import { getForumById } from '~/models/educatorsModels/forumAndPosts';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const forumId = parseInt(resolvedParams.id);
    if (isNaN(forumId)) {
      return NextResponse.json(
        { error: 'ID de foro inválido' },
        { status: 400 }
      );
    }

    const forum = await getForumById(forumId);
    if (!forum) {
      return NextResponse.json(
        { error: 'Foro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(forum);
  } catch (error) {
    console.error('Error al obtener el foro:', error);
    return NextResponse.json(
      { error: 'Error al obtener el foro' },
      { status: 500 }
    );
  }
}
