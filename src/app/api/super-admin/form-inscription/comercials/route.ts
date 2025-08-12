import { type NextRequest,NextResponse } from 'next/server';

import { asc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { comercials } from '~/server/db/schema';

// Zod schema para POST
const schema = z.object({
  commercialContact: z.string().min(1, 'El contacto es requerido'),
});

// GET: listar todos los comerciales (ordenados por contacto)
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(comercials)
      .orderBy(asc(comercials.contact));
    return NextResponse.json({ ok: true, comercials: rows });
  } catch (e) {
    console.error('GET /comercials error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudieron listar los comerciales' },
      { status: 500 }
    );
  }
}

// POST: crear comercial
export async function POST(req: NextRequest) {
  try {
    const { commercialContact } = schema.parse(await req.json());
    const inserted = await db
      .insert(comercials)
      .values({ contact: commercialContact })
      .returning();
    return NextResponse.json({ ok: true, commercial: inserted[0] });
  } catch (e) {
    console.error('POST /comercials error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudo guardar el comercial' },
      { status: 400 }
    );
  }
}
