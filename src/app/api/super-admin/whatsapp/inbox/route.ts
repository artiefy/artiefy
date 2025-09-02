import { NextResponse } from 'next/server';

import { inbox } from '~/app/api/super-admin/whatsapp/_inbox';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ items: inbox });
}
