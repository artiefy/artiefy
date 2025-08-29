import { NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { pagos } from '~/server/db/schema';

// GET /api/super-admin/enroll_user_program/programsUser/pagos?userId=...&programId=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const programId = url.searchParams.get('programId');
  if (!userId || !programId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }
  try {
    const pagosUsuarioPrograma = await db
      .select()
      .from(pagos)
      .where(
        and(eq(pagos.userId, userId), eq(pagos.programaId, Number(programId)))
      );
    return NextResponse.json({ pagos: pagosUsuarioPrograma });
  } catch (error) {
    console.error('Error al consultar pagos:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
