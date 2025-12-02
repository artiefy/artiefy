import { NextResponse } from 'next/server';

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { waConversationTags, waTags } from '~/server/db/schema';
// GET /api/super-admin/whatsapp/inbox/tags?waid=XXXX
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const waid = searchParams.get('waid') ?? '';
  if (!waid)
    return NextResponse.json({ error: 'waid requerido' }, { status: 400 });

  const all = await db.select().from(waTags).orderBy(waTags.name);
  const assigned = await db
    .select({ tagId: waConversationTags.tagId })
    .from(waConversationTags)
    .where(eq(waConversationTags.waid, waid));

  return NextResponse.json({
    tags: all,
    assignedTagIds: assigned.map((a) => a.tagId),
  });
}

// POST { waid, tagId }  -> asigna
export async function POST(req: Request) {
  const { waid, tagId } = await req.json();
  if (!waid || !tagId)
    return NextResponse.json(
      { error: 'waid y tagId requeridos' },
      { status: 400 }
    );

  await db
    .insert(waConversationTags)
    .values({ waid, tagId: Number(tagId) })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as {
    waid?: string | number;
    tagId?: string | number;
  };

  const waidStr = body?.waid != null ? String(body.waid) : '';
  const tagNum = body?.tagId != null ? Number(body.tagId) : NaN;

  if (!waidStr || Number.isNaN(tagNum)) {
    return NextResponse.json(
      { error: 'waid y tagId requeridos' },
      { status: 400 }
    );
  }

  await db
    .delete(waConversationTags)
    .where(
      and(
        eq(waConversationTags.waid, waidStr),
        eq(waConversationTags.tagId, tagNum)
      )
    );

  return NextResponse.json({ ok: true });
}
