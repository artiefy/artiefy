import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { modalidades } from '~/server/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const all = await db
      .select({
        id: modalidades.id,
        name: modalidades.name,
        description: modalidades.description,
      })
      .from(modalidades);

    return NextResponse.json(all);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error fetching modalidades' },
      { status: 500 }
    );
  }
}
