import { NextResponse } from 'next/server';

import { sql } from 'drizzle-orm'; // Add this import, adjust the path if needed

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

export async function GET() {
  const rows = await db
    .select({
      id: sql<string>`CAST(${courses.id} AS TEXT)`.as('id'),
      title: courses.title,
    })
    .from(courses)
    .execute();
  return NextResponse.json({ courses: rows });
}
