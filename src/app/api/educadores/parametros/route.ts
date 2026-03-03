import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  createParametros,
  getParametros,
  getParametrosByCourseId,
} from '~/models/educatorsModels/parametrosModels';

// GET endpoint para obtener parámetros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Si no hay courseId, traer todos los parámetros
    if (!courseId) {
      const allParametros = await getParametros();
      return NextResponse.json(allParametros);
    }

    // Si hay courseId, filtrar por curso
    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const cursoParametros = await getParametrosByCourseId(parsedCourseId);
    return NextResponse.json(cursoParametros);
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener los parámetros' },
      { status: 500 }
    );
  }
}

// POST endpoint para crear parámetros
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = (await request.json()) as {
      name: string;
      description: string;
      porcentaje: number;
      numberOfActivities: number;
      courseId?: number;
    };

    // ✅ Crear el parámetro en la base de datos
    const parametroCreado = await createParametros({
      name: body.name,
      description: body.description,
      porcentaje: body.porcentaje,
      numberOfActivities: body.numberOfActivities || 0,
      courseId: body.courseId,
    });

    return NextResponse.json(parametroCreado);
  } catch (error) {
    console.error('Error al crear el parámetro:', error);
    return NextResponse.json(
      { error: 'Error al crear el parámetro' },
      { status: 500 }
    );
  }
}
