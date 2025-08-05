import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectsTaken, projects, users } from '~/server/db/schema';
import { createTaken } from '~/server/actions/project/taken/createTaken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, projectId } = body;

    if (!userId || !projectId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Verificar si ya está inscrito para evitar duplicados
    const existingEnrollment = await db
      .select()
      .from(projectsTaken)
      .where(
        and(
          eq(projectsTaken.userId, String(userId)),
          eq(projectsTaken.projectId, Number(projectId))
        )
      )
      .limit(1);

    if (existingEnrollment.length > 0) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este proyecto' },
        { status: 400 }
      );
    }

    const result = await createTaken({ userId, projectId: Number(projectId) });
    return NextResponse.json(result, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: 'No se pudo inscribir al proyecto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId, projectId } = body;

    if (!userId || !projectId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    await db
      .delete(projectsTaken)
      .where(
        and(
          eq(projectsTaken.userId, String(userId)),
          eq(projectsTaken.projectId, Number(projectId))
        )
      );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: 'No se pudo renunciar al proyecto' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Obtener responsable del proyecto primero
    const responsable = await db
      .select({
        id: users.id,
        nombre: users.name,
        email: users.email,
        especialidad: sql<string>`''`, // Campo vacío por ahora
        rol: sql<string>`'Responsable'`,
        esResponsable: sql<boolean>`true`,
      })
      .from(projects)
      .innerJoin(users, eq(projects.userId, users.id))
      .where(eq(projects.id, Number(projectId)))
      .limit(1);

    // Obtener integrantes inscritos (excluyendo al responsable para evitar duplicados)
    const integrantes = await db
      .select({
        id: users.id,
        nombre: users.name,
        email: users.email,
        especialidad: sql<string>`''`, // Campo vacío por ahora
        rol: sql<string>`'Integrante'`,
        esResponsable: sql<boolean>`false`,
      })
      .from(projectsTaken)
      .innerJoin(users, eq(projectsTaken.userId, users.id))
      .where(
        and(
          eq(projectsTaken.projectId, Number(projectId)),
          // Excluir al responsable si también está inscrito
          responsable.length > 0
            ? sql`${users.id} != ${responsable[0]?.id}`
            : sql`1=1`
        )
      );

    // Combinar responsable e integrantes
    const todosLosIntegrantes = [...responsable, ...integrantes];

    return NextResponse.json(
      { integrantes: todosLosIntegrantes },
      { status: 200 }
    );
  } catch (_e) {
    return NextResponse.json(
      { error: 'No se pudieron obtener los integrantes' },
      { status: 500 }
    );
  }
}
