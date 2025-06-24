// src/app/api/super-admin/enroll_user_program/programsUser/route.ts

import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollmentPrograms, programas } from '~/server/db/schema';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'Falta userId en la query string' },
        { status: 400 }
      );
    }

    // buscamos todos los programas en los que está inscrito el usuario
    const rows = await db
      .select({
        id: programas.id,
        title: programas.title,
        enrolledAt: enrollmentPrograms.enrolledAt,
        completed: enrollmentPrograms.completed,
      })
      .from(enrollmentPrograms)
      .where(eq(enrollmentPrograms.userId, userId))
      .leftJoin(programas, eq(programas.id, enrollmentPrograms.programaId))
      .execute();

    // eliminamos duplicados por id de programa
    const uniquePrograms = Array.from(
      new Map(rows.map((r) => [r.id, r])).values()
    );

    return NextResponse.json({ programs: uniquePrograms });
  } catch (err) {
    console.error('Error al cargar programas de usuario:', err);
    return NextResponse.json(
      { error: 'Error interno al cargar programas' },
      { status: 500 }
    );
  }
}
