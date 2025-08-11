import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '~/server/db';
import { dates } from '~/server/db/schema';
import { asc } from 'drizzle-orm';

// Nota: en tu schema de DB, startDate es tipo DATE. Aceptamos 'YYYY-MM-DD'.
const schema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD'),
});

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
