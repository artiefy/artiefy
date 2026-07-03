import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export async function GET() {
  try {
    // Security best practice: this returns a directory of users (id/name/email).
    // Require an authenticated session so it is not world-readable.
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
