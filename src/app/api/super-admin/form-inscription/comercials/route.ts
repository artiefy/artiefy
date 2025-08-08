import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';
import { comercials } from '~/server/db/schema';
import { z } from 'zod';

const schema = z.object({
  commercialContact: z.string(),
});

export async function POST(req: NextRequest) {
  const { commercialContact } = schema.parse(await req.json());
  await db.insert(comercials).values({ contact: commercialContact });
  return NextResponse.json({ ok: true });
}
