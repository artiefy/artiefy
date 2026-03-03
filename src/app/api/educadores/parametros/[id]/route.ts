import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  deleteParametro,
  updateParametro,
} from '~/models/educatorsModels/parametrosModels';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const resolvedParams = await params; // Esperar params antes de usar sus propiedades
    const parametroId = parseInt(resolvedParams.id);
    if (isNaN(parametroId)) {
      return NextResponse.json(
        { error: 'ID de parámetro inválido' },
        { status: 400 }
      );
    }

    const data = (await request.json()) as {
      name: string;
      description: string;
      porcentaje: number;
      numberOfActivities: number;
      courseId?: number | null;
    };

    const updatedParametro = await updateParametro({
      id: parametroId,
      name: data.name,
      description: data.description,
      porcentaje: data.porcentaje,
      numberOfActivities: data.numberOfActivities || 0,
      courseId: data.courseId || null,
    });

    return NextResponse.json(updatedParametro);
  } catch (error) {
    console.error('Error al actualizar el parámetro:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el parámetro' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ [DELETE /parametros/[id]] Inicio DELETE request');

    const { userId } = await auth();
    console.log('🔐 [AUTH] userId:', userId);

    if (!userId) {
      console.warn('⚠️ [AUTH] No autorizado - userId no disponible');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const resolvedParams = await params;
    const parametroId = parseInt(resolvedParams.id);
    console.log('📝 [DELETE] Parámetro ID a eliminar:', parametroId);

    if (isNaN(parametroId)) {
      console.warn('⚠️ [DELETE] ID de parámetro inválido:', resolvedParams.id);
      return NextResponse.json(
        { error: 'ID de parámetro inválido' },
        { status: 400 }
      );
    }

    await deleteParametro(parametroId);
    console.log('✅ [DELETE] Parámetro eliminado correctamente');

    return NextResponse.json({
      message: 'Parámetro eliminado',
      id: parametroId,
    });
  } catch (error) {
    console.error('❌ [DELETE] Error al eliminar el parámetro:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el parámetro' },
      { status: 500 }
    );
  }
}
