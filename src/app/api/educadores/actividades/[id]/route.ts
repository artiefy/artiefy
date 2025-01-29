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

    const actividad = await getActivityById(actividadId);
    if (!actividad) {
      return NextResponse.json(
        { error: 'Actividad no encontrado' },
        { status: 404 }
      );
    }

    console.log('Actividad obtenida:', actividad);
    return NextResponse.json(actividad);
  } catch (error) {
    console.error('Error al obtener la actividad:', error);
    return NextResponse.json(
      { error: 'Error al obtener la actividad' },
      { status: 500 }
    );
  }
}
