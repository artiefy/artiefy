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
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }
  try {
    console.log('🔍 [taken/list] Obteniendo usuarios del proyecto:', projectId);

    // Log: muestra todos los registros de projectsTaken para este proyecto
    const relaciones = await db
      .select()
      .from(projectsTaken)
      .where(eq(projectsTaken.projectId, Number(projectId)));
    console.log(
      '📋 [taken/list] Relaciones projectsTaken para el proyecto',
      projectId,
      ':',
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
        isInvited: projectsTaken.isInvited,
      })
      .from(projectsTaken)
      .innerJoin(users, eq(users.id, projectsTaken.userId))
      .where(eq(projectsTaken.projectId, Number(projectId)));

    console.log(
      '✅ [taken/list] Integrantes encontrados para el proyecto',
      projectId,
      ':',
      inscritos.length
    );

    return NextResponse.json(inscritos);
  } catch (error) {
    console.error('❌ [taken/list] Error al obtener integrantes:', error);
    return NextResponse.json(
      { error: 'Error al obtener integrantes', details: String(error) },
      { status: 500 }
    );
  }
}
