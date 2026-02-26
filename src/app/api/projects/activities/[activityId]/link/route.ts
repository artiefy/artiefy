import { type NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectActivities } from '~/server/db/schema';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { activityId } = await params;
    const { linkUrl } = (await req.json()) as { linkUrl?: string | null };

    if (!activityId) {
      return NextResponse.json(
        { error: 'ID de actividad requerido' },
        { status: 400 }
      );
    }

    const numActivityId = parseInt(activityId);
    if (isNaN(numActivityId)) {
      return NextResponse.json(
        { error: 'ID de actividad inválido' },
        { status: 400 }
      );
    }

    // Actualizar el linkUrl de la actividad
    await db
      .update(projectActivities)
      .set({ linkUrl: linkUrl || null })
      .where(eq(projectActivities.id, numActivityId));

    return NextResponse.json(
      { success: true, message: 'Link URL actualizado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar link URL de actividad:', error);
    return NextResponse.json(
      {
        error: 'Error al actualizar el link URL',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
