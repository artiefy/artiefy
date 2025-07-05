import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import { categories } from '~/server/db/schema';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    if (categoryId) {
      // Buscar por categoryId
      const result = await db
        .select()
        .from(categories)
        .where(eq(categories.id, Number(categoryId)));
      return NextResponse.json(result);
    }
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}
