import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';
import { courses, dificultad } from '~/server/db/schema';

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

    // Actualizar dificultad en la BD
    await db
      .update(courses)
      .set({ dificultadid: newValue })
      .where(eq(courses.id, courseId))
      .execute();

    return NextResponse.json({ message: 'Dificultad actualizada con éxito' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error al actualizar la dificultad:', error);
    return NextResponse.json({ error: 'Error al actualizar la dificultad' }, { status: 400 });
  }
}

export async function GET() {
  try {
    debugger
    const dificultades = await db.select().from(dificultad).execute();

    return NextResponse.json(dificultades, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener dificultades:', error);
    return NextResponse.json({ error: 'Error al obtener dificultades' }, { status: 500 });
  }
}
