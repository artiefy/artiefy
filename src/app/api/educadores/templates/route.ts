import { type NextRequest, NextResponse } from 'next/server';

import {
  createParameterTemplate,
  deleteParameterTemplate,
  getAllParameterTemplates,
  getTemplatesByCourseId,
  updateParameterTemplate,
} from '~/models/educatorsModels/templateParametrosModels';

// GET endpoint para obtener plantillas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Si no hay courseId, retorna todas las plantillas
    if (!courseId) {
      const templates = await getAllParameterTemplates();
      return NextResponse.json(templates);
    }

    const parsedCourseId = parseInt(courseId);
    if (isNaN(parsedCourseId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    const templates = await getTemplatesByCourseId(parsedCourseId);
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener las plantillas' },
      { status: 500 }
    );
  }
}

// POST endpoint para crear plantillas
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string;
      description?: string;
      courseId?: number | null;
      creatorId: string;
    };

    if (!body.creatorId) {
      return NextResponse.json(
        { error: 'creatorId es obligatorio' },
        { status: 400 }
      );
    }

    const templateCreated = await createParameterTemplate({
      name: body.name,
      description: body.description,
      courseId: body.courseId ? Number(body.courseId) : null,
      creatorId: body.creatorId,
    });

    return NextResponse.json(templateCreated);
  } catch (error) {
    console.error('Error al crear la plantilla:', error);
    return NextResponse.json(
      {
        error: 'Error al crear la plantilla',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint para eliminar plantillas
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: 'ID de plantilla no proporcionado' },
        { status: 400 }
      );
    }

    const parsedTemplateId = parseInt(templateId);
    if (isNaN(parsedTemplateId)) {
      return NextResponse.json(
        { error: 'ID de plantilla inválido' },
        { status: 400 }
      );
    }

    await deleteParameterTemplate(parsedTemplateId);
    return NextResponse.json({ message: 'Plantilla eliminada' });
  } catch {
    return NextResponse.json(
      { error: 'Error al eliminar la plantilla' },
      { status: 500 }
    );
  }
}

// PUT endpoint para actualizar plantillas
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id: number;
      name: string;
      description?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID de plantilla es obligatorio' },
        { status: 400 }
      );
    }

    const templateUpdated = await updateParameterTemplate({
      id: body.id,
      name: body.name,
      description: body.description,
    });

    return NextResponse.json(templateUpdated);
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar la plantilla' },
      { status: 500 }
    );
  }
}
