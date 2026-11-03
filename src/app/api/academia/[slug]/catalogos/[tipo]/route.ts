/**
 * /api/academia/[slug]/catalogos/[tipo]
 * tipo: categorias | modalidades | niveles | horarios | espacios |
 *       tipos-certificacion
 *
 * GET           — lista [{ id, name, description }] (cualquier cuenta de la
 *                 academia; misma forma que las APIs de catálogos de Artiefy).
 * POST          { name, description? }      — crea (super-admin).
 * PATCH ?id=    { name, description? }      — edita (super-admin).
 * DELETE ?id=                               — elimina (super-admin).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import {
  actualizarEnCatalogo,
  crearEnCatalogo,
  eliminarDeCatalogo,
  esTipoCatalogo,
  listarCatalogo,
  type TipoCatalogo,
} from '~/server/academy/catalogos';
import { ACADEMY_ROLES, type AcademyRole } from '~/server/db/schema';

type Ctx = { params: Promise<{ slug: string; tipo: string }> };

async function resolver({ params }: Ctx, roles: readonly AcademyRole[]) {
  const { slug, tipo } = await params;
  if (!esTipoCatalogo(tipo)) return null;
  const { academia } = await cuentaDeAcademia(slug, roles);
  return { academia, tipo: tipo as TipoCatalogo };
}

const noExiste = () =>
  NextResponse.json({ error: 'Catálogo no encontrado' }, { status: 404 });

const idDe = (request: NextRequest) =>
  Number(request.nextUrl.searchParams.get('id'));

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const r = await resolver(ctx, ACADEMY_ROLES);
    if (!r) return noExiste();
    return NextResponse.json(await listarCatalogo(r.academia.id, r.tipo));
  } catch (error) {
    return respuestaDeError(error, 'catálogo: listar');
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const r = await resolver(ctx, ['super-admin']);
    if (!r) return noExiste();
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const fila = await crearEnCatalogo(r.academia.id, r.tipo, body);
    return NextResponse.json({ ok: true, ...fila }, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, 'catálogo: crear');
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const r = await resolver(ctx, ['super-admin']);
    if (!r) return noExiste();
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    await actualizarEnCatalogo(r.academia.id, r.tipo, idDe(request), body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'catálogo: editar');
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const r = await resolver(ctx, ['super-admin']);
    if (!r) return noExiste();
    await eliminarDeCatalogo(r.academia.id, r.tipo, idDe(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'catálogo: eliminar');
  }
}
