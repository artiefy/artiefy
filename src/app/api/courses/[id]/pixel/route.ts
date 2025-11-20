import { NextResponse } from 'next/server';

import { getCourseById } from '~/server/queries/courses';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('📡 API: Consultando pixel para curso ID:', id);
    const course = await getCourseById(id);

    if (!course) {
      console.log('❌ API: Curso no encontrado');
      return NextResponse.json({ metaPixelId: null }, { status: 404 });
    }

    console.log('✅ API: Pixel encontrado:', course.metaPixelId);
    return NextResponse.json({ metaPixelId: course.metaPixelId ?? null });
  } catch (error) {
    console.error('❌ API: Error fetching course pixel:', error);
    return NextResponse.json({ metaPixelId: null }, { status: 500 });
  }
}
