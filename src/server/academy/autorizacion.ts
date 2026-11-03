import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { type AcademyRole } from '~/server/db/schema';

import { type Academia, academiaPorSlug, ErrorAcademia } from './academias';
import { membresia, type UsuarioAcademia } from './usuarios';

import 'server-only';

/** Super-admin de Artiefy: administra todas las academias. */
export async function esSuperAdminArtiefy(): Promise<string | null> {
  const { userId, sessionClaims } = await auth();
  return userId && sessionClaims?.metadata?.role === 'super-admin'
    ? userId
    : null;
}

/**
 * Cuenta de la sesión dentro de la academia del slug, exigiendo uno de los
 * roles. Lanza ErrorAcademia (401/403/404) si no corresponde.
 */
export async function cuentaDeAcademia(
  slug: string,
  roles: readonly AcademyRole[]
): Promise<{ academia: Academia; cuenta: UsuarioAcademia }> {
  const { userId } = await auth();
  if (!userId) throw new ErrorAcademia('No autorizado', 401);
  const academia = await academiaPorSlug(slug);
  if (!academia) throw new ErrorAcademia('Academia no encontrada', 404);
  const cuenta = await membresia(academia.id, userId);
  if (!cuenta || !roles.includes(cuenta.role)) {
    throw new ErrorAcademia('No autorizado', 403);
  }
  return { academia, cuenta };
}

/** Convierte un error en respuesta JSON (mensaje visible si es de negocio). */
export function respuestaDeError(error: unknown, contexto: string) {
  if (error instanceof ErrorAcademia) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error(`[ACADEMIAS] ${contexto}:`, error);
  return NextResponse.json(
    { error: 'Ocurrió un error inesperado' },
    { status: 500 }
  );
}
