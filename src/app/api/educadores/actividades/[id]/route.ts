import { type NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import {
  getActivityById,
  updateActivity,
} from '~/models/educatorsModels/activitiesModels';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params; // ✅ esto es clave
    const actividadId = parseInt(resolvedParams.id, 10);

    if (isNaN(actividadId)) {
      return NextResponse.json(
        { error: 'ID de la actividad inválido' },
        { status: 400 }
      );
    }

    const actividad = await getActivityById(actividadId);
    if (!actividad) {
      return NextResponse.json(
        { error: 'Actividad no encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ Actividad obtenida:', actividad);
    return NextResponse.json(actividad);
  } catch (error) {
    console.error('❌ Error al obtener la actividad:', error);
    return NextResponse.json(
      { error: 'Error al obtener la actividad' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID de la actividad inválido' },
        { status: 400 }
      );
    }

    const bodySchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      typeid: z.number().optional(),
    });

    const parsed = bodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de entrada no válidos' },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      typeid,
    }: { name?: string; description?: string; typeid?: number } = parsed.data;

    if (
      (name && typeof name !== 'string') ||
      (description && typeof description !== 'string') ||
      (typeid && typeof typeid !== 'number')
    ) {
      return NextResponse.json(
        { error: 'Datos de entrada no válidos' },
        { status: 400 }
      );
    }

    await updateActivity(id, {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(typeid !== undefined && { typeid }),
    });

    return NextResponse.json({
      message: 'Actividad actualizada correctamente',
      id,
    });
  } catch (error) {
    console.error('❌ Error en PUT /api/educadores/actividades/[id]:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error desconocido al actualizar la actividad',
      },
      { status: 500 }
    );
  }
}
