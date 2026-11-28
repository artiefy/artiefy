/**
 * /api/academia/[slug]/usuarios  (solo super-admin DE ESA academia)
 *
 * Mismo contrato que /api/super-admin/academias/[id]/usuarios, pero quien
 * opera es el super-admin de la academia, y no puede cambiarse ni eliminarse a
 * sí mismo.
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  cuentaDeAcademia,
  respuestaDeError,
} from '~/server/academy/autorizacion';
import { listarUsuarios } from '~/server/academy/usuarios';
import * as usuarios from '~/server/academy/usuarios-http';

type Ctx = { params: Promise<{ slug: string }> };

const resolver = async ({ params }: Ctx) =>
  cuentaDeAcademia((await params).slug, ['super-admin']);

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    // El educador también lista (para matricular en sus cursos), pero solo
    // nombre, correo y rol de estudiantes y educadores.
    const { academia, cuenta } = await cuentaDeAcademia(
      (await ctx.params).slug,
      ['super-admin', 'educador']
    );
    if (cuenta.role === 'educador') {
      const lista = await listarUsuarios(academia.id);
      return NextResponse.json({
        usuarios: lista
          .filter((u) => u.role !== 'super-admin' && u.activo)
          .map((u) => ({
            userId: u.userId,
            name: u.name,
            email: u.email,
            role: u.role,
          })),
      });
    }
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
