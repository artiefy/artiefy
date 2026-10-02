/**
 * GET /api/super-admin/grupos/de-usuarios?userIds=a,b,c
 *
 * Devuelve, para un conjunto de usuarios, a qué grupos pertenece cada uno.
 * Se usa en la columna "Grupos" de la lista de estudiantes.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { grupoEstudiantes, grupos } from '~/server/db/schema';

export async function GET(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');
  if (!userId || (role !== 'super-admin' && role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const ids = (request.nextUrl.searchParams.get('userIds') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ porUsuario: {} });
  }

  try {
    const filas = await db
      .select({
        userId: grupoEstudiantes.userId,
        grupoId: grupoEstudiantes.grupoId,
        nombre: grupos.nombre,
      })
      .from(grupoEstudiantes)
      .innerJoin(grupos, eq(grupoEstudiantes.grupoId, grupos.id))
      .where(inArray(grupoEstudiantes.userId, ids));

    const porUsuario: Record<string, { id: number; nombre: string }[]> = {};
    for (const f of filas) {
      porUsuario[f.userId] ??= [];
      porUsuario[f.userId].push({ id: f.grupoId, nombre: f.nombre });
    }

    return NextResponse.json({ porUsuario });
  } catch (error) {
    console.error('[GRUPOS] de-usuarios:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los grupos' },
      { status: 500 }
    );
  }
}
