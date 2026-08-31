/**
 * POST /api/acceso/verificacion-facial
 *
 * Deja constancia de cada verificación facial del control de acceso, tanto si
 * concede como si deniega. Los intentos denegados son justo los que interesa
 * auditar, y no caben en `access_logs` sin falsear el cálculo de quién está
 * dentro.
 *
 * NO recibe imágenes: la comparación ocurre en el navegador y aquí solo llega
 * el veredicto. Ningún dato biométrico sale del equipo del operador.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { db } from '~/server/db';
import { faceVerificationAttempts } from '~/server/db/schema';

const cuerpoSchema = z.object({
  userId: z.string().min(1).nullable().optional(),
  searchTerm: z.string().max(200).nullable().optional(),
  granted: z.boolean(),
  distance: z.number().nullable().optional(),
  reason: z
    .enum(['sin_rostro', 'sin_referencia', 'no_coincide'])
    .nullable()
    .optional(),
});

export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');

  // Solo quien opera el control de acceso puede escribir aquí.
  if (
    !userId ||
    (role !== 'super-admin' && role !== 'admin' && role !== 'educador')
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const datos = cuerpoSchema.safeParse(await request.json());
  if (!datos.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { userId: persona, searchTerm, granted, distance, reason } = datos.data;

  try {
    const [fila] = await db
      .insert(faceVerificationAttempts)
      .values({
        userId: persona ?? null,
        searchTerm: searchTerm ?? null,
        granted,
        distance: distance ?? null,
        reason: reason ?? null,
      })
      .returning({ id: faceVerificationAttempts.id });

    return NextResponse.json({ ok: true, id: fila?.id });
  } catch (error) {
    // Que falle el registro no debe impedir el acceso de quien sí coincide:
    // se avisa en logs y se responde sin romper el flujo.
    console.error('[FACIAL] no se pudo registrar el intento:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
