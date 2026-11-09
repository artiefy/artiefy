import { NextResponse } from 'next/server';

import { type Academia, ErrorAcademia } from './academias';
import { respuestaDeError } from './autorizacion';
import { registrarLog } from './logs';
import {
  agregarUsuario,
  cambiarEstado,
  cambiarRol,
  eliminarUsuario,
  esRolAcademia,
  listarUsuarios,
  membresia,
  reenviarAcceso,
  renombrarUsuario,
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
    const email = String(body.email ?? '');
    const resultado = await agregarUsuario(academia, {
      email,
      nombre: String(body.nombre ?? ''),
      rol: body.rol,
    });
    await registrarLog(
      academia.id,
      resultado.creado ? 'Cuenta creada' : 'Cuenta agregada',
      `${email} (${body.rol})${resultado.correoEnviado ? ' · credenciales enviadas' : ''}`
    );
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    return respuestaDeError(error, 'agregar usuario');
  }
}

/**
 * PATCH { userId, rol?, nombre? } — cambia el rol y/o el nombre de una cuenta.
 * PATCH { userIds[], activo } — activa o desactiva varias cuentas.
 */
export async function cambiar(
  academia: Academia,
  request: Request,
  protegerUserId?: string
) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: unknown;
      userIds?: unknown;
      rol?: unknown;
      nombre?: unknown;
      activo?: unknown;
    };

    if (Array.isArray(body.userIds) && typeof body.activo === 'boolean') {
      const userIds = body.userIds.filter(
        (v): v is string => typeof v === 'string' && v !== protegerUserId
      );
      await cambiarEstado(academia.id, userIds, body.activo);
      await registrarLog(
        academia.id,
        body.activo ? 'Cuentas activadas' : 'Cuentas desactivadas',
        `${userIds.length} cuenta(s)`
      );
      return NextResponse.json({ ok: true, cambiadas: userIds.length });
    }

    const userId = String(body.userId ?? '');
    const cuenta = await membresia(academia.id, userId);
    if (!cuenta) {
      throw new ErrorAcademia('La cuenta no es de esta academia.', 404);
    }
    if (body.rol !== undefined && body.rol !== cuenta.role) {
      if (!esRolAcademia(body.rol)) throw new ErrorAcademia('Rol inválido.');
      if (userId === protegerUserId) {
        throw new ErrorAcademia('No puedes cambiar tu propio rol.');
      }
      await cambiarRol(academia.id, userId, body.rol);
      await registrarLog(
        academia.id,
        'Rol cambiado',
        `${cuenta.email}: ${cuenta.role} → ${body.rol}`
      );
    }
    if (typeof body.nombre === 'string') {
      const nombre = body.nombre.trim();
      if (!nombre) throw new ErrorAcademia('El nombre es obligatorio.');
      if (nombre !== cuenta.name) {
        await renombrarUsuario(academia.id, userId, nombre);
        await registrarLog(
          academia.id,
          'Nombre cambiado',
          `${cuenta.email}: ${nombre}`
        );
      }
    }
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
    const userId = String(body.userId ?? '');
    const resultado = await reenviarAcceso(academia, userId);
    const cuenta = await membresia(academia.id, userId);
    await registrarLog(
      academia.id,
      'Acceso reenviado',
      `${cuenta?.email ?? userId}${resultado.correoEnviado ? ' · correo enviado' : ''}`
    );
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
    const cuenta = await membresia(academia.id, userId);
    const resultado = await eliminarUsuario(academia.id, userId);
    await registrarLog(academia.id, 'Cuenta quitada', cuenta?.email ?? userId);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    return respuestaDeError(error, 'eliminar usuario');
  }
}
