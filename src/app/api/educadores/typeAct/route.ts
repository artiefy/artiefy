import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { typeActi } from '~/server/db/schema';

export async function GET() {
  try {
    // Usando Drizzle para obtener las modalidades
    const allTypes = await db.select().from(typeActi);

    return NextResponse.json(allTypes);
  } catch (error) {
    console.error('Error al obtener las modalidades:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
