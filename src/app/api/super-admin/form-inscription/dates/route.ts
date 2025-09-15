import { type NextRequest,NextResponse } from 'next/server';

import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { dates } from '~/server/db/schema';

// Nota: en tu schema de DB, startDate es tipo DATE. Aceptamos 'YYYY-MM-DD'.
const schema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD'),
});

// Zod para ID por query (?id=123)
const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// PUT: actualizar fecha (?id=)
export async function PUT(req: NextRequest) {
  try {
    const { id } = idSchema.parse({ id: req.nextUrl.searchParams.get('id') });
    const { startDate } = schema.parse(await req.json());

    const updated = await db
      .update(dates)
      .set({ startDate })
      .where(eq(dates.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Fecha no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, date: updated[0] });
  } catch (e) {
    console.error('PUT /dates error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudo actualizar la fecha' },
      { status: 400 }
    );
  }
}

// DELETE: eliminar fecha (?id=)
export async function DELETE(req: NextRequest) {
  try {
    const { id } = idSchema.parse({ id: req.nextUrl.searchParams.get('id') });

    const deleted = await db
      .delete(dates)
      .where(eq(dates.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Fecha no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, date: deleted[0] });
  } catch (e) {
    console.error('DELETE /dates error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudo eliminar la fecha' },
      { status: 400 }
    );
  }
}



// GET: listar todas las fechas (ascendente)
export async function GET() {
  try {
    const rows = await db.select().from(dates).orderBy(asc(dates.startDate));
    return NextResponse.json({ ok: true, dates: rows });
  } catch (e) {
    console.error('GET /dates error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudieron listar las fechas' },
      { status: 500 }
    );
  }
}

// POST: crear fecha
export async function POST(req: NextRequest) {
  try {
    const { startDate } = schema.parse(await req.json());
    const inserted = await db.insert(dates).values({ startDate }).returning();
    return NextResponse.json({ ok: true, date: inserted[0] });
  } catch (e) {
    console.error('POST /dates error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudo guardar la fecha' },
      { status: 400 }
    );
  }
}
