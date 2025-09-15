import { NextResponse } from 'next/server';

import { desc } from 'drizzle-orm';

import { db } from '~/server/db';
import { waMessages } from '~/server/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Devuelve un flat list compatible con tu UI (como antes)
export async function GET() {
  // trae los últimos N (ajusta si quieres paginar)
  const rows = await db
    .select()
    .from(waMessages)
    .orderBy(desc(waMessages.tsMs))
    .limit(5000);

  const items = rows.map((r) => ({
    id: r.metaMessageId ?? String(r.id),
    from: r.direction === 'inbound' ? r.waid : undefined,
    to: r.direction === 'outbound' ? r.waid : undefined,
    name: r.name ?? undefined,
    timestamp: r.tsMs,
    type: r.msgType,
    text: r.body ?? undefined,
    direction: r.direction as 'inbound' | 'outbound' | 'status',
  }));

  return NextResponse.json({ items });
}
