// src/app/api/super-admin/enroll_user_program/programsFilter/route.ts
import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms, programas, users } from '~/server/db/schema';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const programId = url.searchParams.get('programId');

    // 1. Obtener todos los programas
    const allPrograms = await db
      .select({
        id: programas.id,
        title: programas.title,
      })
      .from(programas);

    // 2. Si viene programId, obtener estudiantes inscritos en ese programa
    if (programId) {
      const students = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(enrollmentPrograms)
        .innerJoin(users, eq(enrollmentPrograms.userId, users.id))
        .where(eq(enrollmentPrograms.programaId, Number(programId)));

      return NextResponse.json({ programs: allPrograms, students });
    }

    // Si no se solicita ningún programa, solo devolvemos la lista de programas
    return NextResponse.json({ programs: allPrograms });
  } catch (error) {
    console.error('❌ Error en programsFilter:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
