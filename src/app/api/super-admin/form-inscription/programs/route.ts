import { NextResponse } from 'next/server';

import { asc } from 'drizzle-orm';

import { db } from '~/server/db';
import { programas } from '~/server/db/schema';

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(programas)
      .orderBy(asc(programas.title));
    return NextResponse.json({ ok: true, programs: rows });
  } catch (_err) {
    return NextResponse.json({ ok: false, error: 'Error' }, { status: 500 });
  }
}
