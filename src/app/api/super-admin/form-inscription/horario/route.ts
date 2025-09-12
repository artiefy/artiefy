import { type NextRequest, NextResponse } from 'next/server';

import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { horario } from '~/server/db/schema';

// Zod schema para POST
const schema = z.object({
  schedules: z.string().min(1, 'El horario es requerido'),
});

// Zod para ID por query (?id=123)
const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// PUT: actualizar horario (?id=)
export async function PUT(req: NextRequest) {
  try {
    const { id } = idSchema.parse({
      id: req.nextUrl.searchParams.get('id'),
    });
    const { schedules } = schema.parse(await req.json());

    const updated = await db
      .update(horario)
      .set({ schedule: schedules })
      .where(eq(horario.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Horario no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, schedule: updated[0] });
  } catch (e) {
    console.error('PUT /horario error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudo actualizar el horario' },
      { status: 400 }
    );
  }
}

// DELETE: eliminar horario (?id=)
export async function DELETE(req: NextRequest) {
  try {
    const { id } = idSchema.parse({
      id: req.nextUrl.searchParams.get('id'),
    });

    const deleted = await db
      .delete(horario)
      .where(eq(horario.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Horario no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, schedule: deleted[0] });
  } catch (e) {
    console.error('DELETE /horario error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudo eliminar el horario' },
      { status: 400 }
    );
  }
}



// GET: listar todos los horarios (ordenados alfabéticamente)
export async function GET() {
  try {
    const rows = await db.select().from(horario).orderBy(asc(horario.schedule));
    return NextResponse.json({ ok: true, horarios: rows });
  } catch (e) {
    console.error('GET /horario error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudieron listar los horarios' },
      { status: 500 }
    );
  }
}

// POST: crear comercial
export async function POST(req: NextRequest) {
  try {
    const { schedules } = schema.parse(await req.json());
    const inserted = await db
      .insert(horario)
      .values({ schedule: schedules })
      .returning();
    return NextResponse.json({ ok: true, schedule: inserted[0] });
  } catch (e) {
    console.error('POST /comercials error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudo guardar el comercial' },
      { status: 400 }
    );
  }
}
