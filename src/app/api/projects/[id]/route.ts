import { NextResponse } from 'next/server';

import { deleteProjectById } from '~/server/actions/project/deleteProject';
import { getProjectById } from '~/server/actions/project/getProjectById';
import { updateProject } from '~/server/actions/project/updateProject';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    if (!idParam) return respondWithError('ID de proyecto requerido', 400);
    const projectId = Number(idParam);
    if (isNaN(projectId)) return respondWithError('ID inválido', 400);

    const project = await getProjectById(projectId);
    if (!project) return respondWithError('Proyecto no encontrado', 404);
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
          'coverImageKey',
          'type_project',
          'categoryId',
          'isPublic',
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
  } catch {
    return respondWithError('Error al actualizar el proyecto', 500);
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    if (!idParam) return respondWithError('ID de proyecto requerido', 400);
    const projectId = Number(idParam);
    if (isNaN(projectId)) return respondWithError('ID inválido', 400);

    const deleted = await deleteProjectById(projectId);
    if (!deleted)
      return respondWithError('No se pudo eliminar el proyecto', 404);
    return NextResponse.json({ success: true });
  } catch {
    return respondWithError('Error al eliminar el proyecto', 500);
  }
}
