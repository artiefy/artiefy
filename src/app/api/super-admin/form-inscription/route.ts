import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';
import { userCustomFields, dates, comercials } from '~/server/db/schema';

const schema = z.object({
  userId: z.string(),
  fields: z.record(z.string(), z.string()),
  startDate: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const data = schema.parse(json);
  // guardar campos Custom
  await Promise.all(
    Object.entries(data.fields).map(([key, value]) =>
      db.insert(userCustomFields).values({
        userId: data.userId,
        fieldKey: key,
        fieldValue: value,
      })
    )
  );
  // guardar fecha
  await db.insert(dates).values({
    userId: data.userId,
    startDate: data.startDate,
  });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const all = await db.select().from(userCustomFields);
  const allDates = await db.select().from(dates);
  const allComercials = await db.select().from(comercials);
  return NextResponse.json({
    fields: all,
    dates: allDates,
    comercials: allComercials,
  });
}
