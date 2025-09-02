// src/app/api/super-admin/whatsapp/webhook/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { clearInbox, inbox } from '../../_inbox';

import type { InboxItem } from '../../_inbox'; // Asegúrate que este tipo exista o ajústalo

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function log(...args: unknown[]) {
  console.log('[WA-LOGS]', ...args);
}

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  log('GET logs', { search: url.search });

  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10), 1),
    300
  );
  const offset = Math.max(
    parseInt(url.searchParams.get('offset') ?? '0', 10),
    0
  );
  const q = (url.searchParams.get('q') ?? '').toLowerCase();
  const dir = url.searchParams.get('direction') as
    | 'inbound'
    | 'outbound'
    | 'status'
    | null;
  const fromFilter = url.searchParams.get('from');
  const sinceParam = url.searchParams.get('since');
  const since = sinceParam ? Number(sinceParam) : undefined;

  let items: InboxItem[] = [...inbox]; // newest first

  if (Number.isFinite(since)) {
    const sinceMs =
      String(since).length === 10 ? Number(since) * 1000 : Number(since);
    items = items.filter((i) => i.timestamp >= sinceMs);
  }
  if (dir) items = items.filter((i) => i.direction === dir);
  if (fromFilter)
    items = items.filter((i) => (i.from ?? '').includes(fromFilter));
  if (q) {
    items = items.filter(
      (i) =>
        (i.text ?? '').toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        (i.from ?? '').toLowerCase().includes(q) ||
        (i.name ?? '').toLowerCase().includes(q)
    );
  }

  const total = items.length;
  const page = items.slice(offset, offset + limit);

  return NextResponse.json(
    { total, items: page },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export function DELETE() {
  clearInbox();
  log('🗑️ Inbox cleared');
  return NextResponse.json({ ok: true });
}
