/**
 * /api/academia/[slug]/usuarios  (solo super-admin DE ESA academia)
 *
 * Mismo contrato que /api/super-admin/academias/[id]/usuarios, pero quien
 * opera es el super-admin de la academia, y no puede cambiarse ni eliminarse a
 * sí mismo.
 */

import { type NextRequest } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import * as usuarios from '~/server/academy/usuarios-http';

type Ctx = { params: Promise<{ slug: string }> };

const resolver = async ({ params }: Ctx) =>
  cuentaDeAcademia((await params).slug, ['super-admin']);

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { academia } = await resolver(ctx);
    return usuarios.listar(academia);
  } catch (error) {
    return respuestaDeError(error, 'academia: listar');
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { academia } = await resolver(ctx);
    return usuarios.agregar(academia, request);
  } catch (error) {
    return respuestaDeError(error, 'academia: agregar');
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const { academia, cuenta } = await resolver(ctx);
    return usuarios.cambiar(academia, request, cuenta.userId);
  } catch (error) {
    return respuestaDeError(error, 'academia: cambiar rol');
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { academia } = await resolver(ctx);
    return usuarios.reenviar(academia, request);
  } catch (error) {
    return respuestaDeError(error, 'academia: reenviar acceso');
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const { academia, cuenta } = await resolver(ctx);
    return usuarios.eliminar(academia, request, cuenta.userId);
  } catch (error) {
    return respuestaDeError(error, 'academia: eliminar');
  }
}
