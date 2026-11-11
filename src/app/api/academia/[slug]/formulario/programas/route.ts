/**
 * GET /api/academia/[slug]/formulario/programas  (PÚBLICO)
 *
 * Programas activos de la academia para el formulario de inscripción, con la
 * forma de /api/super-admin/form-inscription/programs.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { academiaPorSlug } from '~/server/academy/academias';
import { configuracionFormulario } from '~/server/academy/ajustes';
import { respuestaDeError } from '~/server/academy/autorizacion';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const academia = await academiaPorSlug((await params).slug);
    if (!academia?.activa) {
      return NextResponse.json({ ok: false, programs: [] }, { status: 404 });
    }
    const { programas } = await configuracionFormulario(academia.id);
    return NextResponse.json({ ok: true, programs: programas });
  } catch (error) {
    return respuestaDeError(error, 'formulario: programas');
  }
}
