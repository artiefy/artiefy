import { and, asc, eq, inArray } from 'drizzle-orm';

import { PERMISOS_ACADEMIA } from '~/lib/academy/permisos';
import { db } from '~/server/db';
import {
  academyRolesSecundarios,
  academyUsers,
  academyUsuarioRoles,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Roles secundarios de una academia: un nombre con permisos sobre secciones
// del panel, asignado a cuentas de la academia. Hoy son informativos (no
// abren ni cierran secciones); el rol principal sigue en academy_users.

const CLAVES = PERMISOS_ACADEMIA.map(([k]) => k) as string[];

export async function listarRoles(academyId: number) {
  const [roles, asignados] = await Promise.all([
    withRetry(() =>
      db
        .select()
        .from(academyRolesSecundarios)
        .where(eq(academyRolesSecundarios.academyId, academyId))
        .orderBy(asc(academyRolesSecundarios.nombre))
    ),
    withRetry(() =>
      db
        .select({
          rolId: academyUsuarioRoles.rolId,
          academyUserId: academyUsers.id,
          name: academyUsers.name,
          email: academyUsers.email,
        })
        .from(academyUsuarioRoles)
        .innerJoin(
          academyUsers,
          eq(academyUsers.id, academyUsuarioRoles.academyUserId)
        )
        .where(eq(academyUsers.academyId, academyId))
    ),
  ]);
  return roles.map((r) => ({
    ...r,
    usuarios: asignados
      .filter((a) => a.rolId === r.id)
      .map(({ academyUserId, name, email }) => ({
        academyUserId,
        name,
        email,
      })),
  }));
}

interface DatosRol {
  nombre: string;
  permisos: string[];
  academyUserIds: number[];
}

async function validar(
  academyId: number,
  body: Record<string, unknown>
): Promise<DatosRol> {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  if (!nombre) throw new ErrorAcademia('El nombre del rol es obligatorio.');
  const permisos = Array.isArray(body.permisos)
    ? [
        ...new Set(
          body.permisos.filter((p): p is string => CLAVES.includes(p as string))
        ),
      ]
    : [];
  const pedidos = Array.isArray(body.academyUserIds)
    ? [...new Set(body.academyUserIds.map(Number).filter(Number.isInteger))]
    : [];
  const validos =
    pedidos.length > 0
      ? await db
          .select({ id: academyUsers.id })
          .from(academyUsers)
          .where(
            and(
              eq(academyUsers.academyId, academyId),
              inArray(academyUsers.id, pedidos)
            )
          )
      : [];
  return { nombre, permisos, academyUserIds: validos.map((u) => u.id) };
}

const esDuplicado = (error: unknown) =>
  String((error as { cause?: { code?: string } })?.cause?.code) === '23505';

async function guardarAsignaciones(rolId: number, ids: number[]) {
  await db
    .delete(academyUsuarioRoles)
    .where(eq(academyUsuarioRoles.rolId, rolId));
  if (ids.length > 0) {
    await db
      .insert(academyUsuarioRoles)
      .values(ids.map((academyUserId) => ({ rolId, academyUserId })))
      .onConflictDoNothing();
  }
}

export async function crearRol(
  academyId: number,
  body: Record<string, unknown>
) {
  const { academyUserIds, ...datos } = await validar(academyId, body);
  try {
    const [nuevo] = await db
      .insert(academyRolesSecundarios)
      .values({ academyId, ...datos })
      .returning({ id: academyRolesSecundarios.id });
    await guardarAsignaciones(nuevo!.id, academyUserIds);
    return { id: nuevo!.id, nombre: datos.nombre };
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorAcademia('Ya existe un rol con ese nombre.', 409);
    }
    throw error;
  }
}

async function rolDe(academyId: number, id: number) {
  const [fila] = await db
    .select({
      id: academyRolesSecundarios.id,
      nombre: academyRolesSecundarios.nombre,
    })
    .from(academyRolesSecundarios)
    .where(
      and(
        eq(academyRolesSecundarios.id, id),
        eq(academyRolesSecundarios.academyId, academyId)
      )
    )
    .limit(1);
  if (!fila) throw new ErrorAcademia('Rol no encontrado', 404);
  return fila;
}

export async function actualizarRol(
  academyId: number,
  id: number,
  body: Record<string, unknown>
) {
  await rolDe(academyId, id);
  const { academyUserIds, ...datos } = await validar(academyId, body);
  try {
    await db
      .update(academyRolesSecundarios)
      .set(datos)
      .where(eq(academyRolesSecundarios.id, id));
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorAcademia('Ya existe un rol con ese nombre.', 409);
    }
    throw error;
  }
  await guardarAsignaciones(id, academyUserIds);
  return datos.nombre;
}

export async function eliminarRol(academyId: number, id: number) {
  const rol = await rolDe(academyId, id);
  await db
    .delete(academyRolesSecundarios)
    .where(eq(academyRolesSecundarios.id, id));
  return rol.nombre;
}
