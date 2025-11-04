import { NextResponse } from 'next/server';

import { getCoursesByProgramId } from '~/server/actions/superAdmin/program/getCoursesByProgramId';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const courses = await getCoursesByProgramId(id);

    // 👇 si no hay cursos, devuelve array vacío en vez de 404 (como decías en el comentario)
    if (!courses || courses.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses by program id:', error);
    return NextResponse.json(
      { error: 'Error fetching courses' },
      { status: 500 }
    );
  }
}
