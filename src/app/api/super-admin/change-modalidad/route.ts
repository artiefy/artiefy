import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { courses, modalidades } from '~/server/db/schema';

const updateSchema = z.object({
  courseId: z.number(),
  newValue: z.number(),
});

type UpdateRequest = z.infer<typeof updateSchema>;

export async function PUT(req: Request) {
  try {
    const body = await req.json() as UpdateRequest;
    const { courseId, newValue } = updateSchema.parse({
      courseId: Number(body.courseId),
      newValue: Number(body.newValue),
    });

    await db
      .update(courses)
      .set({ modalidadesid: newValue })
      .where(eq(courses.id, courseId))
      .execute();

    return NextResponse.json({ message: 'Modalidad actualizada con éxito' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error al actualizar la modalidad:', error);
    return NextResponse.json({ error: 'Error al actualizar la modalidad' }, { status: 400 });
  }
}


export async function GET() {
  try {
    const modalidadesList = await db.select().from(modalidades).execute();

    return NextResponse.json(modalidadesList, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener modalidades:', error);
    return NextResponse.json({ error: 'Error al obtener modalidades' }, { status: 500 });
  }
}

