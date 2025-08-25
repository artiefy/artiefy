import { NextResponse } from 'next/server';

import { getMateriasByCourseId } from '~/server/actions/educadores/getMateriasByCourseId';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;
    const materias = await getMateriasByCourseId(courseId);
    if (!materias) {
      return NextResponse.json(
        { error: 'Materias not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(materias);
  } catch (error) {
    console.error('Error fetching materias:', error);
    return NextResponse.json(
      { error: 'Error fetching materias' },
      { status: 500 }
    );
  }
}
