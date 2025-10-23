import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';
import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { project_drafts } from '~/server/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user?.id)
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    // Usar sql para ordenar descendente de forma segura
    const rows = await db
      .select()
      .from(project_drafts)
      .where(eq(project_drafts.user_id, user.id))
      .orderBy(sql`"updated_at" DESC`);

    // Mapear sólo campos necesarios para la respuesta
    const drafts = rows.map((r) => ({
      id: r.id,
      data: r.data,
      projectStep: r.project_step ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json({ drafts });
  } catch (err) {
    console.error('Error listing drafts:', err);
    return NextResponse.json(
      { error: 'Error al listar borradores' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user?.id)
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const body = (await req.json()) as {
      data: unknown;
      projectStep?: string;
    } | null;
    if (!body?.data)
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const [created] = await db
      .insert(project_drafts)
      .values({
        user_id: user.id,
        data: body.data,
        project_step: body.projectStep ?? null,
      })
      .returning();

    return NextResponse.json({
      id: created.id,
      created_at: created.created_at,
      updated_at: created.updated_at,
    });
  } catch (err) {
    console.error('Error creating draft:', err);
    return NextResponse.json(
      { error: 'Error al crear borrador' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user?.id)
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const body = (await req.json()) as {
      id?: number;
      data?: unknown;
      projectStep?: string;
    } | null;
    const id = body?.id ? Number(body.id) : NaN;
    if (!Number.isFinite(id) || !body?.data) {
      return NextResponse.json(
        { error: 'id y data requeridos' },
        { status: 400 }
      );
    }

    // Verificar propietario
    const existingRows = await db
      .select()
      .from(project_drafts)
      .where(eq(project_drafts.id, id))
      .limit(1);
    const existing = existingRows[0];
    if (!existing)
      return NextResponse.json(
        { error: 'Borrador no encontrado' },
        { status: 404 }
      );
    if (existing.user_id !== user.id)
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const [updated] = await db
      .update(project_drafts)
      .set({
        data: body.data,
        project_step: body.projectStep ?? existing.project_step,
        updated_at: new Date(),
      })
      .where(eq(project_drafts.id, id))
      .returning();

    return NextResponse.json({
      id: updated.id,
      updated_at: updated.updated_at,
    });
  } catch (err) {
    console.error('Error updating draft:', err);
    return NextResponse.json(
      { error: 'Error al actualizar borrador' },
      { status: 500 }
    );
  }
}
