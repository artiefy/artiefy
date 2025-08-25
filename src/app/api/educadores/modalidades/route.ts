import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { modalidades } from '~/server/db/schema';

export async function GET() {
  try {
    // Usando Drizzle para obtener las modalidades
    const allModalidades = await db.select().from(modalidades);

    return NextResponse.json(allModalidades);
  } catch (error) {
    console.error('Error al obtener las modalidades:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
