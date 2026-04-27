import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms } from '~/server/db/schema';

async function unenrollFromProgram(
  programId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return {
        success: false,
        message: 'Usuario no autenticado',
      };
    }

    await db
      .delete(enrollmentPrograms)
      .where(
        and(
          eq(enrollmentPrograms.userId, user.id),
          eq(enrollmentPrograms.programaId, programId)
        )
      );

    return {
      success: true,
      message: 'Inscripcion cancelada exitosamente',
    };
  } catch (error) {
    console.error('Error en unenrollFromProgram:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function POST(request: Request) {
  const { programId } = (await request.json()) as { programId?: number };

  if (!programId) {
    return NextResponse.json(
      { success: false, message: 'programId es requerido' },
      { status: 400 }
    );
  }

  const result = await unenrollFromProgram(programId);

  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
