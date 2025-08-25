import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
  }

  // Si el userId es numérico, devolver un nombre genérico (no buscar en la tabla Clerk)
  if (!isNaN(Number(userId))) {
    return NextResponse.json({ name: 'No disponible' });
  }

  // Buscar solo si es un userId tipo string (Clerk)
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = result[0];
  if (!user) {
    // Devuelve un nombre genérico si no existe el usuario
    return NextResponse.json({ name: 'No disponible' });
  }

  return NextResponse.json({ name: user.name });
}
