import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { dates } from '~/server/db/schema';
import { z } from 'zod';

const schema = z.object({
  startDate: z.string(), // No .datetime() si estás usando sólo fecha
});

export async function POST(req: NextRequest) {
  const { startDate } = schema.parse(await req.json());
  await db.insert(dates).values({ startDate });
  return NextResponse.json({ ok: true });
}
