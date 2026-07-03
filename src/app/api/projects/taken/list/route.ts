import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectsTaken, users } from '~/server/db/schema';

export async function GET(request: Request) {
  // Security best practice: this endpoint returns member PII (email, phone,
  // address, birth date). Require an authenticated session.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // Cambia aquí para aceptar ambos nombres de parámetro
  const projectId =
    searchParams.get('projectId') ?? searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }
  try {
    // Trae los usuarios inscritos al proyecto con info básica
    const inscritos = await db
      .select({
        id: users.id,
        nombre: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        country: users.country,
        city: users.city,
        address: users.address,
        age: users.age,
        birthDate: users.birthDate,
        isInvited: projectsTaken.isInvited,
      })
      .from(projectsTaken)
      .innerJoin(users, eq(users.id, projectsTaken.userId))
      .where(eq(projectsTaken.projectId, Number(projectId)));

    return NextResponse.json(inscritos);
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener integrantes' },
      { status: 500 }
    );
  }
}
