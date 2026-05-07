import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { typesCourses } from '~/server/db/schema';

export async function GET() {
  const data = await db.select().from(typesCourses);
  return NextResponse.json(data);
}
