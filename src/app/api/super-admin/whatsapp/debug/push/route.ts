import { NextRequest, NextResponse } from 'next/server';

import { pushInbox } from '../../_inbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'disabled in production' },
      { status: 403 }
    );
  }
 interface MockRequestBody {
  from?: string;
  text?: string;
  name?: string;
}

const body = (await req.json().catch(() => ({}))) as MockRequestBody;
const from = body.from ?? '573013423627';
const text = body.text ?? 'Mensaje de prueba';

pushInbox({
  id: 'mock_' + Date.now(),
  direction: 'inbound',
  timestamp: Date.now(),
  from,
  name: body.name ?? 'Mock User',
  type: 'text',
  text,
  raw: { mock: true },
});


  return NextResponse.json({ ok: true });
}
