/**
 * /api/super-admin/academias/[id]  (solo super-admin de Artiefy)
 *
 * GET   — datos de la academia y sus cuentas.
 * PATCH — edición parcial (mismos campos que al crear, más `activa`).
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  academiaPorId,
  actualizarAcademia,
  validarDatosAcademia,
} from '~/server/academy/academias';
import {
  esSuperAdminArtiefy,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { listarUsuarios } from '~/server/academy/usuarios';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  if (!(await esSuperAdminArtiefy())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const academia = await academiaPorId(Number((await params).id));
    if (!academia) {
      return NextResponse.json(
        { error: 'Academia no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      academia,
      usuarios: await listarUsuarios(academia.id),
    });
  } catch (error) {
    return respuestaDeError(error, 'detalle');
  }
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  if (!(await esSuperAdminArtiefy())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const id = Number((await params).id);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const datos = validarDatosAcademia(body, true);
    await actualizarAcademia(id, {
      ...datos,
      ...(typeof body.activa === 'boolean' ? { activa: body.activa } : {}),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'actualizar');
  }
}
