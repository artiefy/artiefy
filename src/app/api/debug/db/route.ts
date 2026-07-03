import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { courses } from '~/server/db/schema';

export async function GET() {
  try {
    // Ejecuta una consulta mínima para verificar conectividad
    const sample = await db.select({ id: courses.id }).from(courses).limit(1);
    return NextResponse.json({ ok: true, rows: sample.length });
  } catch (err) {
    console.error('Debug DB endpoint error:', err);

    const cause =
      err instanceof Error
        ? (err as Error & { cause?: unknown }).cause
        : undefined;
    const causeMessage =
      cause instanceof Error
        ? cause.message
        : cause !== undefined
          ? String(cause)
          : undefined;
    const message = err instanceof Error ? err.message : String(err);

    return NextResponse.json(
      { ok: false, message, cause: causeMessage },
      { status: 500 }
    );
  }
}
