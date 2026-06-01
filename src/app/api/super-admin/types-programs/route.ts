import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { typesPrograms } from '~/server/db/schema';

export async function GET() {
  const types = await db.select().from(typesPrograms);
  return NextResponse.json(types);
}
