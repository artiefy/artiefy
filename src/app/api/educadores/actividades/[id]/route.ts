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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

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
      revisada: z.boolean().optional(),
      parametroId: z.number().nullable().optional(),
      porcentaje: z.number().min(0).max(100).optional(),
      fechaMaximaEntrega: z.string().datetime().nullable().optional(), // ISO string
      fechaInicioActividad: z.string().datetime().nullable().optional(),
      // opcional: “dryRun” para solo loguear sin guardar
      dryRun: z.boolean().optional(),
    });

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos de entrada no válidos',
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      typeid,
      revisada,
      parametroId,
      porcentaje,
      fechaMaximaEntrega,
      fechaInicioActividad,
      dryRun,
    } = parsed.data;

    // Reglas de negocio: si no es revisada => limpiar parametro/porcentaje
    const payload: Record<string, unknown> = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(typeid !== undefined && { typeid }),
      ...(revisada !== undefined && { revisada }),
      ...(fechaMaximaEntrega !== undefined && {
        fechaMaximaEntrega: fechaMaximaEntrega
          ? new Date(fechaMaximaEntrega)
          : null,
      }),
      ...(fechaInicioActividad !== undefined && {
        fechaInicioActividad: fechaInicioActividad
          ? new Date(fechaInicioActividad)
          : null,
      }),
    };

    if (revisada === false) {
      payload.parametroId = null;
      payload.porcentaje = 0;
    } else if (revisada === true) {
      if (parametroId !== undefined) payload.parametroId = parametroId ?? null;
      if (porcentaje !== undefined) payload.porcentaje = porcentaje ?? 0;
    } else {
      // Si no vino “revisada”, igual permite actualizar parámetro/porcentaje de forma explícita
      if (parametroId !== undefined) payload.parametroId = parametroId ?? null;
      if (porcentaje !== undefined) payload.porcentaje = porcentaje ?? 0;
    }

    // 🔎 Log visible + modo DryRun
    const types = {
      name: typeof name,
      description: typeof description,
      typeid: typeof typeid,
      revisada: typeof revisada,
      parametroId: parametroId === null ? 'null' : typeof parametroId,
      porcentaje: typeof porcentaje,
      fechaMaximaEntrega: typeof fechaMaximaEntrega,
    };
    console.log('▶ PUT /actividades/:id payload normalizado:', {
      id,
      payload,
      types,
      dryRun: !!dryRun,
    });
    console.log('🧩 updateActivity(id, payload):', id, payload);

    if (dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, id, payload });
    }

    await updateActivity(id, payload);

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
