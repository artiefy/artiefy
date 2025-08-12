import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export async function GET() {
  try {
    // Selecciona todos los usuarios
    const allUsers = await db.select().from(users);

    // Mapea para asegurar que siempre haya un nombre
    const result = allUsers.map((u) => ({
      id: u.id,
      name: u.name && u.name.trim() !== '' ? u.name : (u.email ?? ''),
      email: u.email,
      // Puedes agregar más campos si lo necesitas
    }));

    return NextResponse.json(result);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
