import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { categories, courses } from '~/server/db/schema';

const updateSchema = z.object({
  courseId: z.number(),
  newValue: z.number(),
});

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as z.infer<typeof updateSchema>;
    const { courseId, newValue } = updateSchema.parse({
      courseId: Number(body.courseId),
      newValue: Number(body.newValue),
    });

    await db
      .update(courses)
      .set({ categoryid: newValue })
      .where(eq(courses.id, courseId))
      .execute();

    return NextResponse.json(
      { message: 'Categoría actualizada con éxito' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error al actualizar la categoría:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la categoría' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const categoriasList = await db.select().from(categories).execute();

    return NextResponse.json(categoriasList, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}
