/**
 * GET /api/academias/mis-vistas
 *
 * Academias en las que la cuenta autenticada tiene acceso activo (y con qué
 * rol), para el selector de vista del menú. Solo devuelve las del propio
 * usuario.
 */

import { NextResponse } from 'next/server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { and, asc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { academies, academyUsers } from '~/server/db/schema';

const EMAIL_SELECTOR_VISTA = 'lmsg829@gmail.com';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // El selector de vista es solo para esta cuenta: para las demás no hay vistas.
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (email !== EMAIL_SELECTOR_VISTA) {
    return NextResponse.json({ vistas: [] });
  }

  try {
    const vistas = await db
      .select({
        slug: academies.slug,
        nombre: academies.nombre,
        role: academyUsers.role,
      })
      .from(academyUsers)
      .innerJoin(academies, eq(academies.id, academyUsers.academyId))
      .where(
        and(
          eq(academyUsers.userId, userId),
          eq(academyUsers.activo, true),
          eq(academies.activa, true),
          eq(academies.esArtiefy, false)
        )
      )
      .orderBy(asc(academies.nombre));

    return NextResponse.json({ vistas });
  } catch (error) {
    console.error('[ACADEMIAS] mis-vistas:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar las vistas' },
      { status: 500 }
    );
  }
}
