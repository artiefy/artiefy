import { NextResponse } from 'next/server';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { pagos } from '~/server/db/schema';

// Los 3 conceptos especiales y su nroPago sugerido
export const CONCEPTOS_ESPECIALES = [
  { label: 'PÓLIZA Y CARNET', nroPago: 13 },
  { label: 'UNIFORME', nroPago: 14 },
  { label: 'DERECHOS DE GRADO', nroPago: 15 },
] as const;

type ConceptoLabel = (typeof CONCEPTOS_ESPECIALES)[number]['label'];

function isConceptoEspecial(s: string): s is ConceptoLabel {
  return CONCEPTOS_ESPECIALES.some((c) => c.label === s);
}

// GET /api/super-admin/enroll_user_program/programsUser/pagos/conceptos?userId=...&programId=...
// Devuelve los pagos existentes (si hay) para esos 3 conceptos
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const programId = url.searchParams.get('programId');
  if (!userId || !programId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  try {
    const labels = CONCEPTOS_ESPECIALES.map((c) => c.label);
    const rows = await db
      .select()
      .from(pagos)
      .where(
        and(
          eq(pagos.userId, userId),
          eq(pagos.programaId, Number(programId)),
          inArray(pagos.concepto, labels)
        )
      );

    // También devolvemos el “plan” por si no existen aún
    return NextResponse.json({
      conceptos: CONCEPTOS_ESPECIALES,
      pagos: rows,
    });
  } catch (error) {
    console.error('Error GET conceptos especiales:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST /api/super-admin/enroll_user_program/programsUser/pagos/conceptos
// Body JSON: { userId, programId, concepto, fecha, metodo, valor, nro_pago? }
// Upsert SOLO si el concepto es uno de los 3 especiales.
export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json().catch(() => null);
    if (!raw || typeof raw !== 'object') {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }
    const body = raw as {
      userId?: unknown;
      programId?: unknown;
      concepto?: unknown;
      metodo?: unknown;
      valor?: unknown;
      fecha?: unknown;
      nro_pago?: unknown;
    };

    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';

    const programId =
      typeof body.programId === 'number'
        ? body.programId
        : typeof body.programId === 'string'
          ? Number(body.programId)
          : NaN;

    const concepto =
      typeof body.concepto === 'string'
        ? body.concepto.toUpperCase().trim()
        : '';

    const metodo = typeof body.metodo === 'string' ? body.metodo : '';

    const valor =
      typeof body.valor === 'number'
        ? body.valor
        : typeof body.valor === 'string'
          ? Number(body.valor)
          : 0;

    const fechaInput = typeof body.fecha === 'string' ? body.fecha : '';

    const fecha =
      fechaInput && !Number.isNaN(new Date(fechaInput).getTime())
        ? new Date(fechaInput).toISOString().split('T')[0]
        : null;

    if (!userId || !Number.isFinite(programId) || !fecha) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }
    if (!isConceptoEspecial(concepto)) {
      return NextResponse.json(
        { error: 'Concepto no permitido' },
        { status: 400 }
      );
    }

    const sugerido = CONCEPTOS_ESPECIALES.find((c) => c.label === concepto)!;
    const nroPago =
      typeof body.nro_pago === 'number'
        ? body.nro_pago
        : typeof body.nro_pago === 'string'
          ? Number(body.nro_pago)
          : sugerido.nroPago;

    // Upsert
    const existing = await db
      .select()
      .from(pagos)
      .where(
        and(
          eq(pagos.userId, userId),
          eq(pagos.programaId, programId),
          eq(pagos.nroPago, nroPago)
        )
      );

    if (existing.length > 0) {
      await db
        .update(pagos)
        .set({ concepto, metodo, valor, fecha })
        .where(
          and(
            eq(pagos.userId, userId),
            eq(pagos.programaId, programId),
            eq(pagos.nroPago, nroPago)
          )
        );
    } else {
      await db.insert(pagos).values({
        userId,
        programaId: programId,
        concepto,
        nroPago,
        fecha,
        metodo,
        valor,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error POST conceptos especiales:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
