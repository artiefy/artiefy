import { NextResponse } from 'next/server';

import { type Academia, ErrorAcademia } from './academias';
import { respuestaDeError } from './autorizacion';
import {
  agregarUsuario,
  cambiarRol,
  eliminarUsuario,
  esRolAcademia,
  listarUsuarios,
  membresia,
  reenviarAcceso,
} from './usuarios';

import 'server-only';

// Handlers de las cuentas de una academia, compartidos por el panel de Artiefy
// (/api/super-admin/academias/[id]/usuarios) y el super-admin de la propia
// academia (/api/academia/[slug]/usuarios). Cada ruta resuelve antes QUIÉN
// puede operar sobre qué academia.

export async function listar(academia: Academia) {
  try {
    return NextResponse.json({ usuarios: await listarUsuarios(academia.id) });
  } catch (error) {
    return respuestaDeError(error, 'listar usuarios');
  }
}

/** POST { email, nombre, rol } */
export async function agregar(academia: Academia, request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown;
      nombre?: unknown;
      rol?: unknown;
    };
    if (!esRolAcademia(body.rol)) throw new ErrorAcademia('Rol inválido.');
    const resultado = await agregarUsuario(academia, {
      email: String(body.email ?? ''),
      nombre: String(body.nombre ?? ''),
      rol: body.rol,
    });
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    return respuestaDeError(error, 'agregar usuario');
  }
}

/** PATCH { userId, rol } */
export async function cambiar(
  academia: Academia,
  request: Request,
  protegerUserId?: string
) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: unknown;
      rol?: unknown;
    };
    const userId = String(body.userId ?? '');
    if (!esRolAcademia(body.rol)) throw new ErrorAcademia('Rol inválido.');
    if (userId === protegerUserId) {
      throw new ErrorAcademia('No puedes cambiar tu propio rol.');
    }
    if (!(await membresia(academia.id, userId))) {
      throw new ErrorAcademia('La cuenta no es de esta academia.', 404);
    }
    await cambiarRol(academia.id, userId, body.rol);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, 'cambiar rol');
  }
}

/** PUT { userId } — reenvía el acceso por correo (ver reenviarAcceso). */
export async function reenviar(academia: Academia, request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: unknown;
    };
    const resultado = await reenviarAcceso(academia, String(body.userId ?? ''));
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    return respuestaDeError(error, 'reenviar acceso');
  }
}

/**
 * DELETE ?userId= — quita la cuenta de la academia (y la borra de Clerk solo
 * si la creó una academia y no está en ninguna otra).
 */
export async function eliminar(
  academia: Academia,
  request: Request,
  protegerUserId?: string
) {
  try {
    const userId = new URL(request.url).searchParams.get('userId') ?? '';
    if (userId === protegerUserId) {
      throw new ErrorAcademia('No puedes eliminar tu propia cuenta.');
    }
    const resultado = await eliminarUsuario(academia.id, userId);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    return respuestaDeError(error, 'eliminar usuario');
  }
}
