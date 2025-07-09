import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import deleteProject from '~/server/actions/project/deleteProject';
import { getProjectById } from '~/server/actions/project/getProjectById';
import { updateProject } from '~/server/actions/project/updateProject';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    if (!idParam) return respondWithError('ID de proyecto requerido', 400);
    const projectId = Number(idParam);
    if (isNaN(projectId)) return respondWithError('ID inválido', 400);

    // Verificar si se solicitan detalles completos mediante query parameter
    const { searchParams } = new URL(req.url);
    const includeDetails = searchParams.get('details') === 'true';

    const project = await getProjectById(projectId);
    if (!project) return respondWithError('Proyecto no encontrado', 404);

    // Si se solicitan detalles completos, devolver todo
    if (includeDetails) {
      return NextResponse.json({
        ...project,
        // Asegurarse de que estos campos estén incluidos
        objetivos_especificos: project.objetivos_especificos || [],
        actividades: project.actividades || [],
      });
    }

    // Comportamiento original para compatibilidad
    return NextResponse.json(project);
  } catch {
    return respondWithError('Error al obtener el proyecto', 500);
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    if (!idParam) return respondWithError('ID de proyecto requerido', 400);
    const projectId = Number(idParam);
    if (isNaN(projectId)) return respondWithError('ID inválido', 400);

    const body = (await req.json().catch(() => ({}))) as { isPublic?: unknown };
    const isPublic = typeof body.isPublic === 'boolean' ? body.isPublic : false;
    const updated = await updateProject(projectId, { isPublic });

    if (!updated)
      return respondWithError(
        'No se pudo actualizar el estado público del proyecto',
        404
      );
    return NextResponse.json({ success: true });
  } catch {
    return respondWithError(
      'Error al actualizar el estado público del proyecto',
      500
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    if (!idParam) return respondWithError('ID de proyecto requerido', 400);
    const projectId = Number(idParam);
    if (isNaN(projectId)) return respondWithError('ID inválido', 400);

    const body = (await req.json()) as Record<string, unknown>;
    const { id, userId, createdAt, updatedAt, ...updateFields } = body;

    const allowedFields: Record<string, unknown> = {};
    for (const key of Object.keys(updateFields)) {
      if (
        [
          'name',
          'planteamiento',
          'justificacion',
          'objetivo_general',
          'objetivos_especificos',
          'actividades',
          'coverImageKey',
          'type_project',
          'categoryId',
          'isPublic',
          'fechaInicio',
          'fechaFin',
          'tipoVisualizacion',
        ].includes(key)
      ) {
        allowedFields[key] = updateFields[key];
      }
    }

    if (Object.keys(allowedFields).length === 0) {
      return respondWithError('No hay campos para actualizar', 400);
    }

    const updated = await updateProject(projectId, allowedFields);
    if (!updated)
      return respondWithError('No se pudo actualizar el proyecto', 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return respondWithError('Error al actualizar el proyecto', 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'ID de proyecto inválido' },
        { status: 400 }
      );
    }

    const result = await deleteProject(projectId, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en DELETE /api/projects/[id]:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
