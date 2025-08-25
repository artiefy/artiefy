import { NextResponse } from 'next/server';

import { inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms, materias, programas } from '~/server/db/schema';

export async function DELETE(request: Request) {
  try {
    const { programIds } = (await request.json()) as { programIds: number[] };

    if (!programIds || !Array.isArray(programIds)) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs de programas' },
        { status: 400 }
      );
    }

    // 1. Delete enrollment relationships
    await db
      .delete(enrollmentPrograms)
      .where(inArray(enrollmentPrograms.programaId, programIds));

    // 2. Update materias to remove program association instead of deleting them
    await db
      .update(materias)
      .set({
        programaId: null,
        courseid: null,
      })
      .where(inArray(materias.programaId, programIds));

    // 3. Finally delete the programs
    await db.delete(programas).where(inArray(programas.id, programIds));

    return NextResponse.json({ message: 'Programas eliminados exitosamente' });
  } catch (error) {
    console.error('Error al eliminar programas:', error);
    return NextResponse.json(
      { error: 'Error al eliminar los programas' },
      { status: 500 }
    );
  }
}
