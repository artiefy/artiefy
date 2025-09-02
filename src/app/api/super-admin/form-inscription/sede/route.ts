import { type NextRequest, NextResponse } from 'next/server';

import { asc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '~/server/db';
import { sede } from '~/server/db/schema';

// Validación para POST
const schema = z.object({
  nombre: z.string().trim().min(1, 'El nombre de la sede es requerido'),
});

// GET: listar todas las sedes (ordenadas alfabéticamente)
export async function GET() {
  try {
    // 👈 usar las keys del schema de Drizzle: id y nombre
    const rows = await db
      .select({ id: sede.id, nombre: sede.nombre })
      .from(sede)
      .orderBy(asc(sede.nombre));

    return NextResponse.json({ ok: true, sedes: rows });
  } catch (e) {
    console.error('GET /sede error:', e);
    return NextResponse.json(
      { ok: false, error: 'No se pudieron listar las sedes' },
      { status: 500 }
    );
  }
}

// POST: crear sede
export async function POST(req: NextRequest) {
  try {
    const { nombre } = schema.parse(await req.json());

    // 👈 insertar usando la key correcta (nombre)
    const inserted = await db
      .insert(sede)
      .values({ nombre })
      .returning({ id: sede.id, nombre: sede.nombre });

    const sedeInsertada = inserted?.[0];
    if (!sedeInsertada) {
      return NextResponse.json(
        { ok: false, error: 'No se pudo guardar la sede' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, sede: sedeInsertada });
  } catch (e: unknown) {
    console.error('POST /sede error:', e);

    function hasPgCode(err: unknown): err is { code: string } {
      return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as Record<string, unknown>).code === 'string'
      );
    }

    const message =
      hasPgCode(e) && e.code === '23505'
        ? 'Ya existe una sede con ese nombre'
        : 'No se pudo guardar la sede';

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
