/**
 * /api/super-admin/academias/[id]/usuarios  (solo super-admin de Artiefy)
 *
 * GET    — cuentas de la academia.
 * POST   { email, nombre, rol } — agrega (o crea y envía credenciales).
 * PATCH  { userId, rol }        — cambia el rol.
 * PUT    { userId }             — reenvía el acceso por correo.
 * DELETE ?userId=               — elimina la cuenta.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { academiaPorId } from '~/server/academy/academias';
import { esSuperAdminArtiefy } from '~/server/academy/autorizacion';
import * as usuarios from '~/server/academy/usuarios-http';

type Ctx = { params: Promise<{ id: string }> };

async function resolver({ params }: Ctx) {
  if (!(await esSuperAdminArtiefy())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const academia = await academiaPorId(Number((await params).id));
  return (
    academia ??
    NextResponse.json({ error: 'Academia no encontrada' }, { status: 404 })
  );
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const a = await resolver(ctx);
  return a instanceof NextResponse ? a : usuarios.listar(a);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const a = await resolver(ctx);
  return a instanceof NextResponse ? a : usuarios.agregar(a, request);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const a = await resolver(ctx);
  return a instanceof NextResponse ? a : usuarios.cambiar(a, request);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const a = await resolver(ctx);
  return a instanceof NextResponse ? a : usuarios.reenviar(a, request);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const a = await resolver(ctx);
  return a instanceof NextResponse ? a : usuarios.eliminar(a, request);
}
