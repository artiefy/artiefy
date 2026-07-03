import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { projects, projectsTaken, users } from '~/server/db/schema';
import { authorizeOwnerOrStaff } from '~/server/utils/apiAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, projectId, isInvited } = body;

    if (!userId || !projectId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Security best practice: a user may only enroll themselves; staff may act
    // on behalf of others.
    const authz = await authorizeOwnerOrStaff(String(userId));
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

    // Verificar si ya está inscrito
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
      // Si ya existe, actualizar el campo isInvited si es necesario
      if (
        isInvited !== undefined &&
        existingEnrollment[0]?.isInvited !== isInvited
      ) {
        await db
          .update(projectsTaken)
          .set({ isInvited: Boolean(isInvited) })
          .where(
            and(
              eq(projectsTaken.userId, String(userId)),
              eq(projectsTaken.projectId, Number(projectId))
            )
          );
        return NextResponse.json(
          { success: true, updated: true },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'Ya estás inscrito en este proyecto' },
        { status: 400 }
      );
    }

    // Insertar con campo isInvited
    await db.insert(projectsTaken).values({
      userId: String(userId),
      projectId: Number(projectId),
      isInvited: Boolean(isInvited),
      createdAt: new Date(), // ✅ Agregar explícitamente para evitar null
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
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

    // Security best practice: a user may only remove their own participation;
    // staff may act on behalf of others.
    const authz = await authorizeOwnerOrStaff(String(userId));
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
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
    // Security best practice: require an authenticated session — this returns
    // member names and emails (PII).
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
        isInvited: sql<boolean>`false`,
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
        isInvited: projectsTaken.isInvited,
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
  } catch {
    return NextResponse.json(
      { error: 'No se pudieron obtener los integrantes' },
      { status: 500 }
    );
  }
}
