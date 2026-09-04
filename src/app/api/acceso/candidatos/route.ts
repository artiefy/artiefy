/**
 * GET /api/acceso/candidatos
 *
 * Lista las personas que tienen foto biométrica registrada
 * (`users.profileImageKey`). Es el conjunto contra el que el control de acceso
 * intenta identificar el rostro capturado por la cámara (búsqueda 1:N).
 *
 * Devuelve solo lo necesario para la comparación en el navegador: id, nombre,
 * correo y la URL pública de la foto. La comparación de rostros ocurre en el
 * cliente; aquí no se procesa ninguna imagen.
 */

import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, isNotNull, ne } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const BASE_S3 = 'https://s3.us-east-2.amazonaws.com/artiefy-upload';

export async function GET() {
  const { userId, sessionClaims } = await auth();
  const role = String(sessionClaims?.metadata?.role ?? '');

  if (
    !userId ||
    (role !== 'super-admin' && role !== 'admin' && role !== 'educador')
  ) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const filas = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        key: users.profileImageKey,
      })
      .from(users)
      .where(
        and(isNotNull(users.profileImageKey), ne(users.profileImageKey, ''))
      );

    const candidatos = filas.map((f) => ({
      id: f.id,
      name: f.name ?? f.email,
      email: f.email,
      fotoUrl: f.key
        ? f.key.startsWith('http')
          ? f.key
          : `${BASE_S3}/${f.key}`
        : null,
    }));

    return NextResponse.json({ candidatos });
  } catch (error) {
    console.error('[ACCESO] no se pudieron listar los candidatos:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los candidatos' },
      { status: 500 }
    );
  }
}
