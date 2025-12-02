import { type NextRequest, NextResponse } from 'next/server';

import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { comercials } from '~/server/db/schema';

// Zod schema para POST
const schema = z.object({
  commercialContact: z.string().min(1, 'El contacto es requerido'),
});

// Zod schema para ID por query (?id=123)
const idSchema = z.object({
  id: z.coerce.number().int().positive(),
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

// PUT: actualizar comercial (?id=)
export async function PUT(req: NextRequest) {
  try {
    const { id } = idSchema.parse({
      id: req.nextUrl.searchParams.get('id'),
    });
    const body = await req.json();
    const { commercialContact } = schema.parse(body);

    const updated = await db
      .update(comercials)
      .set({ contact: commercialContact })
      .where(eq(comercials.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Comercial no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, commercial: updated[0] });
  } catch (e) {
    console.error('PUT /comercials error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudo actualizar el comercial' },
      { status: 400 }
    );
  }
}

// DELETE: eliminar comercial (?id=)
export async function DELETE(req: NextRequest) {
  try {
    const { id } = idSchema.parse({
      id: req.nextUrl.searchParams.get('id'),
    });

    const deleted = await db
      .delete(comercials)
      .where(eq(comercials.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Comercial no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, commercial: deleted[0] });
  } catch (e) {
    console.error('DELETE /comercials error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudo eliminar el comercial' },
      { status: 400 }
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
