/**
 * POST /api/super-admin/courses/[id]/duplicar  (solo super-admin de Artiefy)
 *
 * Duplica el curso dentro de Artiefy (queda oculto como "… (copia)") con sus
 * educadores, parámetros, clases y actividades.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  esSuperAdminArtiefy,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { duplicarCursoArtiefy } from '~/server/academy/envios';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Ctx) {
  const userId = await esSuperAdminArtiefy();
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const nuevo = await duplicarCursoArtiefy(Number((await params).id), userId);
    return NextResponse.json({ ok: true, ...nuevo });
  } catch (error) {
    return respuestaDeError(error, 'duplicar curso');
  }
}
