import { type NextRequest, NextResponse } from 'next/server';

import { asc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { horario } from '~/server/db/schema';

// Zod schema para POST
const schema = z.object({
  schedules: z.string().min(1, 'El horario es requerido'),
});

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
