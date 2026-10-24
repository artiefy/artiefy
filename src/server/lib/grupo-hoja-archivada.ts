import { NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { grupos } from '~/server/db/schema';

// Una hoja archivada ("Archivar y duplicar") es de solo lectura. Las rutas que
// escriben en una hoja llaman a esto antes de tocar nada: devuelve la respuesta
// de rechazo, o null si se puede escribir.
export const rechazarSiHojaArchivada = async (
  grupoId: number
): Promise<NextResponse | null> => {
  // Id inválido: lo valida cada ruta con su propio mensaje.
  if (!Number.isInteger(grupoId) || grupoId <= 0) return null;
  const [hoja] = await db
    .select({ hojaArchivada: grupos.hojaArchivada })
    .from(grupos)
    .where(eq(grupos.id, grupoId))
    .limit(1);
  if (!hoja?.hojaArchivada) return null;
  return NextResponse.json(
    { error: 'Esta hoja está archivada y no se puede modificar' },
    { status: 423 }
  );
};
