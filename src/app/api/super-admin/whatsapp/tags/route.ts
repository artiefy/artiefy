import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { waTags } from '~/server/db/schema';

interface TagRequest {
  id?: string | number;
  name?: unknown;
  color?: unknown;
}

export async function GET() {
  const tags = await db.select().from(waTags).orderBy(waTags.name);
  return NextResponse.json({ tags });
}

export async function POST(req: Request) {
  const body = (await req.json()) as TagRequest;
  const { name, color } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(waTags)
      .values({
        name: name.trim(),
        color: typeof color === 'string' ? color.trim() : null,
      })
      .returning();
    return NextResponse.json({ tag: created });
  } catch (_error) {
    return NextResponse.json(
      { error: 'No se pudo crear (¿duplicado?)' },
      { status: 409 }
    );
  }
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as TagRequest;
  const { id, name, color } = body;

  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  }

  const data: { name?: string; color?: string | null } = {};

  if (typeof name === 'string') {
    data.name = name.trim();
  }

  if (typeof color === 'string') {
    data.color = color.trim();
  } else if (color === null) {
    data.color = null;
  }

  const [updated] = await db
    .update(waTags)
    .set(data)
    .where(eq(waTags.id, Number(id)))
    .returning();

  return NextResponse.json({ tag: updated });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as TagRequest;
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  }

  await db.delete(waTags).where(eq(waTags.id, Number(id)));
  return NextResponse.json({ ok: true });
}
