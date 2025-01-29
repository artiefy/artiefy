import { NextResponse } from 'next/server';
import { getActivityById } from '~/models/educatorsModels/activitiesModels';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const actividadId = parseInt(resolvedParams.id);
    if (isNaN(actividadId)) {
      return NextResponse.json(
        { error: 'ID de la actividad inválido' },
        { status: 400 }
      );
    }

    const lesson = await getActivityById(actividadId);
    if (!lesson) {
      return NextResponse.json(
        { error: 'Actividad no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error al obtener la actividad:', error);
    return NextResponse.json(
      { error: 'Error al obtener la actividad' },
      { status: 500 }
    );
  }
}
