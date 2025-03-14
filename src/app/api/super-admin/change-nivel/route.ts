import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';
import { courses, nivel } from '~/server/db/schema';

// Definir esquema de validación con Zod
const updateSchema = z.object({
  courseId: z.number(),
  newValue: z.number(),
});

export async function PUT(req: Request) {
  try {
    // Validar y parsear los datos
    const body = await req.json() as { courseId: number; newValue: number };
    const { courseId, newValue } = updateSchema.parse({
      courseId: Number(body.courseId),
      newValue: Number(body.newValue),
    });

    // Actualizar nivel en la BD
    await db
      .update(courses)
      .set({ nivelid: newValue })
      .where(eq(courses.id, courseId))
      .execute();

    return NextResponse.json({ message: 'nivel actualizada con éxito' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error al actualizar la nivel:', error);
    return NextResponse.json({ error: 'Error al actualizar la nivel' }, { status: 400 });
  }
}

export async function GET() {
  try {
    
    const niveles = await db.select().from(nivel).execute();

    return NextResponse.json(niveles, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener niveles:', error);
    return NextResponse.json({ error: 'Error al obtener niveles' }, { status: 500 });
  }
}
