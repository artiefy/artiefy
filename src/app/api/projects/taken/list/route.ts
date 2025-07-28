import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectsTaken, users } from '~/server/db/schema';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Cambia aquí para aceptar ambos nombres de parámetro
  const projectId =
    searchParams.get('projectId') ?? searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json([], { status: 400 });
  }
  try {
    // Log: muestra todos los registros de projectsTaken para este proyecto
    const relaciones = await db
      .select()
      .from(projectsTaken)
      .where(eq(projectsTaken.projectId, Number(projectId)));
    console.log(
      'Relaciones projectsTaken para el proyecto',
      projectId,
      relaciones
    );

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
        // Si tienes campos personalizados, agrégalos aquí
      })
      .from(projectsTaken)
      .innerJoin(users, eq(users.id, projectsTaken.userId))
      .where(eq(projectsTaken.projectId, Number(projectId)));

    // Log para depuración
    console.log(
      'Integrantes encontrados para el proyecto',
      projectId,
      inscritos
    );

    return NextResponse.json(inscritos);
  } catch (_e) {
    return NextResponse.json([], { status: 500 });
  }
}
