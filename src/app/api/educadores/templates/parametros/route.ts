import { type NextRequest, NextResponse } from 'next/server';

import {
  addParametroToTemplate,
  removeParametroFromTemplate,
} from '~/models/educatorsModels/templateParametrosModels';

// POST endpoint para agregar parámetro a plantilla
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      templateId: number;
      parametroId: number;
      order: number;
    };

    if (!body.templateId || !body.parametroId) {
      return NextResponse.json(
        { error: 'templateId y parametroId son obligatorios' },
        { status: 400 }
      );
    }

    const result = await addParametroToTemplate({
      templateId: body.templateId,
      parametroId: body.parametroId,
      order: body.order || 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

// DELETE endpoint para remover parámetro de plantilla
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const parametroId = searchParams.get('parametroId');

    if (!templateId || !parametroId) {
      return NextResponse.json(
        { error: 'templateId y parametroId son obligatorios' },
        { status: 400 }
      );
    }

    await removeParametroFromTemplate({
      templateId: parseInt(templateId),
      parametroId: parseInt(parametroId),
    });

    return NextResponse.json({ message: 'Parámetro removido de la plantilla' });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
