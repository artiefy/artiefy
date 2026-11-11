import { clerkClient } from '@clerk/nextjs/server';
import { and, asc, eq, inArray } from 'drizzle-orm';

import { urlAcademia } from '~/lib/academy/host';
import { db } from '~/server/db';
import {
  ACADEMY_ROLES,
  type AcademyRole,
  academyUsers,
  users,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';
import { generarPasswordSegura } from '~/utils/generatePassword';

import { type Academia, ErrorAcademia } from './academias';
import { transporteDe } from './correo';

import 'server-only';

// Cuentas de las academias.
//
// La identidad vive en Clerk (instancia única); el rol de cada cuenta en cada
// academia está en academy_users. Hay dos tipos de cuenta:
//  - propia (cuentaPropia): la crea la academia. Lleva academyId/academySlug
//    en su metadata (sin `role`), el webhook de Clerk no la registra en la
//    tabla users de Artiefy y el middleware la manda a su academia.
//  - vinculada: una cuenta que ya existía (de Artiefy u otra academia). Entra
//    con su misma contraseña; su metadata y su rol de Artiefy no se tocan.
//
// Academias "de Artiefy" (esArtiefy): comparten la sesión con Artiefy. Una
// cuenta de Artiefy que entra se registra sola (membresiaConArtiefy) y las
// cuentas que crea la academia son también de Artiefy (rol estudiante).

export type UsuarioAcademia = typeof academyUsers.$inferSelect;

export const ETIQUETA_ROL: Record<AcademyRole, string> = {
  'super-admin': 'Super-admin',
  educador: 'Educador',
  estudiante: 'Estudiante',
};

/** Ruta del dashboard de cada rol dentro del subdominio de la academia. */
export const RUTA_DASHBOARD: Record<AcademyRole, string> = {
  'super-admin': '/dashboard/super-admin',
  educador: '/dashboard/educator',
  estudiante: '/dashboard/student',
};

export const esRolAcademia = (v: unknown): v is AcademyRole =>
  typeof v === 'string' && (ACADEMY_ROLES as readonly string[]).includes(v);

export async function listarUsuarios(academyId: number) {
  return withRetry(() =>
    db
      .select()
      .from(academyUsers)
      .where(eq(academyUsers.academyId, academyId))
      .orderBy(asc(academyUsers.role), asc(academyUsers.name))
  );
}

/** Rol en la academia para una cuenta de Artiefy (según su rol en Artiefy). */
const rolDesdeArtiefy = (rol: string | undefined): AcademyRole =>
  rol === 'super-admin' || rol === 'admin'
    ? 'super-admin'
    : rol === 'educador'
      ? 'educador'
      : 'estudiante';

/**
 * Cuenta de la sesión en la academia. En una academia "de Artiefy", una
 * cuenta de Artiefy que aún no está se registra sola (vinculada, con el rol
 * equivalente al de Artiefy), así la misma sesión sirve en ambas. Las cuentas
 * propias de otra academia (academySlug sin rol de Artiefy) no entran.
 */
export async function membresiaConArtiefy(
  academia: Academia,
  userId: string,
  metadata: { role?: string; academySlug?: string } | undefined
): Promise<UsuarioAcademia | null> {
  const fila = await membresia(academia.id, userId);
  if (fila || !academia.esArtiefy) return fila;
  const deOtraAcademia = Boolean(metadata?.academySlug) && !metadata?.role;
  if (deOtraAcademia) return null;

  let [cuenta] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!cuenta) {
    const clerk = await clerkClient();
    const u = await clerk.users.getUser(userId).catch(() => null);
    const email = u?.primaryEmailAddress?.emailAddress;
    if (!email) return null;
    cuenta = {
      email,
      name: [u?.firstName, u?.lastName].filter(Boolean).join(' ') || null,
    };
  }

  await db
    .insert(academyUsers)
    .values({
      academyId: academia.id,
      userId,
      email: cuenta.email.toLowerCase(),
      name: cuenta.name ?? cuenta.email,
      role: rolDesdeArtiefy(metadata?.role),
      cuentaPropia: false,
    })
    .onConflictDoNothing();
  return membresia(academia.id, userId);
}

/** Cuenta (y rol) del usuario dentro de la academia, o null si no es suya. */
export async function membresia(
  academyId: number,
  userId: string
): Promise<UsuarioAcademia | null> {
  const [fila] = await withRetry(() =>
    db
      .select()
      .from(academyUsers)
      .where(
        and(
          eq(academyUsers.academyId, academyId),
          eq(academyUsers.userId, userId)
        )
      )
      .limit(1)
  );
  return fila ?? null;
}

// Username obligatorio en esta instancia de Clerk: parte local del correo +
// sufijo hasta encontrar uno libre.
async function usernameLibre(email: string): Promise<string> {
  const clerk = await clerkClient();
  const base =
    (email.split('@')[0] ?? 'usuario')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 40)
      .padEnd(4, '0') || 'usuario';
  for (let intento = 0; intento < 6; intento++) {
    const candidato =
      intento === 0
        ? base
        : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const { data } = await clerk.users.getUserList({ username: [candidato] });
    if (data.length === 0) return candidato;
  }
  return `${base}${Date.now()}`;
}

const escapar = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!
  );

async function enviarCredenciales(
  academia: Academia,
  email: string,
  nombre: string,
  password: string
) {
  const entrar = urlAcademia(academia.slug, '/sign-in');
  const marca = escapar(academia.nombre);
  const { transporte, from } = await transporteDe(academia);
  await transporte.sendMail({
    from,
    to: email,
    subject: `Bienvenido a ${academia.nombre} - Tus credenciales de acceso`,
    html: `
      <h2 style="color:${academia.colorPrimario}">¡Bienvenido a ${marca}, ${escapar(nombre)}!</h2>
      <p>Estas son tus credenciales de acceso:</p>
      <ul>
        <li><strong>Correo:</strong> ${escapar(email)}</li>
        <li><strong>Contraseña:</strong> <code>${escapar(password)}</code></li>
      </ul>
      <p>Ingresa en <a href="${entrar}" target="_blank">${entrar}</a> y cambia tu contraseña lo antes posible.</p>
    `,
    text: `Bienvenido a ${academia.nombre}, ${nombre}!\n\nCorreo: ${email}\nContrasena: ${password}\n\nIngresa en ${entrar}`,
  });
}

// Cuenta existente (Artiefy u otra academia) vinculada: no se conoce ni se
// cambia su contraseña, así que el aviso le dice que entre con la de siempre.
async function enviarAvisoDeAcceso(
  academia: Academia,
  email: string,
  nombre: string,
  rol: AcademyRole
) {
  const entrar = urlAcademia(academia.slug, '/sign-in');
  const marca = escapar(academia.nombre);
  const { transporte, from } = await transporteDe(academia);
  await transporte.sendMail({
    from,
    to: email,
    subject: `Ya tienes acceso a ${academia.nombre}`,
    html: `
      <h2 style="color:${academia.colorPrimario}">¡Hola, ${escapar(nombre)}!</h2>
      <p>Te agregaron a <strong>${marca}</strong> como <strong>${ETIQUETA_ROL[rol]}</strong>.</p>
      <p>Entra en <a href="${entrar}" target="_blank">${entrar}</a> con tu correo
      <strong>${escapar(email)}</strong> y la misma contraseña que ya usas.</p>
    `,
    text: `Hola, ${nombre}. Te agregaron a ${academia.nombre} como ${ETIQUETA_ROL[rol]}.\nEntra en ${entrar} con tu correo ${email} y la contrasena que ya usas.`,
  });
}

/**
 * Correo libre de la academia a varios destinatarios ("Correo" en Gestión de
 * Estudiantes). Uno por destinatario, para no exponer los correos entre sí.
 * Devuelve cuántos se enviaron.
 */
export async function enviarCorreoAcademia(
  academia: Academia,
  destinos: string[],
  asunto: string,
  mensaje: string
): Promise<number> {
  const html = `<div style="font-family:sans-serif;white-space:pre-line">${escapar(
    mensaje
  )}</div>`;
  const { transporte, from } = await transporteDe(academia);
  let enviados = 0;
  for (const to of destinos.slice(0, 200)) {
    const ok = await intentarCorreo(
      transporte
        .sendMail({
          from,
          to,
          subject: asunto,
          html,
          text: mensaje,
        })
        .then(() => undefined)
    );
    if (ok) enviados++;
  }
  return enviados;
}

/** Envía un correo sin que su fallo tumbe la operación. */
async function intentarCorreo(envio: Promise<void>): Promise<boolean> {
  try {
    await envio;
    return true;
  } catch (error) {
    console.error('[ACADEMIAS] no se pudo enviar el correo:', error);
    return false;
  }
}

/**
 * Reenvía el acceso a una cuenta de la academia:
 *  - creada por la academia: genera una contraseña nueva y se la envía;
 *  - vinculada (Artiefy u otra academia): reenvía el aviso, sin tocar su
 *    contraseña (es la misma de Artiefy).
 */
export async function reenviarAcceso(
  academia: Academia,
  userId: string
): Promise<{ correoEnviado: boolean; nuevaClave: boolean }> {
  const cuenta = await membresia(academia.id, userId);
  if (!cuenta)
    throw new ErrorAcademia('La cuenta no es de esta academia.', 404);
  const nombre = cuenta.name ?? cuenta.email;

  if (!cuenta.cuentaPropia) {
    const correoEnviado = await intentarCorreo(
      enviarAvisoDeAcceso(academia, cuenta.email, nombre, cuenta.role)
    );
    return { correoEnviado, nuevaClave: false };
  }

  const password = generarPasswordSegura();
  const clerk = await clerkClient();
  await clerk.users.updateUser(userId, { password });
  const correoEnviado = await intentarCorreo(
    enviarCredenciales(academia, cuenta.email, nombre, password)
  );
  return { correoEnviado, nuevaClave: true };
}

export interface NuevoUsuario {
  email: string;
  nombre: string;
  rol: AcademyRole;
}

/**
 * Agrega una cuenta a la academia.
 *  - Si el correo ya está en ESTA academia, actualiza su rol y nombre.
 *  - Si ya tiene cuenta (Artiefy u otra academia), la vincula: entra con su
 *    misma contraseña y se le envía un aviso de acceso.
 *  - Si no existe, crea la cuenta en Clerk, la registra y envía credenciales.
 */
export async function agregarUsuario(
  academia: Academia,
  { email, nombre, rol }: NuevoUsuario
): Promise<{ creado: boolean; vinculado: boolean; correoEnviado: boolean }> {
  const correo = email.trim().toLowerCase();
  const nombreLimpio = nombre.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new ErrorAcademia('El correo no es válido.');
  }
  if (!nombreLimpio) throw new ErrorAcademia('El nombre es obligatorio.');
  if (!esRolAcademia(rol)) throw new ErrorAcademia('Rol inválido.');

  const clerk = await clerkClient();
  const { data: existentes } = await clerk.users.getUserList({
    emailAddress: [correo],
  });
  const existente = existentes[0];

  if (existente) {
    const fila = await membresia(academia.id, existente.id);
    if (fila) {
      await db
        .update(academyUsers)
        .set({ role: rol, name: nombreLimpio })
        .where(eq(academyUsers.id, fila.id));
      return { creado: false, vinculado: false, correoEnviado: false };
    }
    // Cuenta existente: se vincula sin tocar su metadata ni su rol de Artiefy.
    await db.insert(academyUsers).values({
      academyId: academia.id,
      userId: existente.id,
      email: correo,
      name: nombreLimpio,
      role: rol,
      cuentaPropia: false,
    });
    const correoEnviado = await intentarCorreo(
      enviarAvisoDeAcceso(academia, correo, nombreLimpio, rol)
    );
    return { creado: false, vinculado: true, correoEnviado };
  }

  const password = generarPasswordSegura();
  const [firstName, ...resto] = nombreLimpio.split(/\s+/);
  const creado = await clerk.users.createUser({
    emailAddress: [correo],
    username: await usernameLibre(correo),
    password,
    firstName,
    lastName: resto.join(' ') || undefined,
    // Academia de Artiefy: la cuenta es también de Artiefy (estudiante); el
    // webhook la registra en `users` y puede entrar a artiefy.com. Si no,
    // queda aislada en su academia.
    publicMetadata: academia.esArtiefy
      ? { role: 'estudiante', mustChangePassword: true }
      : {
          academyId: academia.id,
          academySlug: academia.slug,
          mustChangePassword: true,
        },
  });

  try {
    await db.insert(academyUsers).values({
      academyId: academia.id,
      userId: creado.id,
      email: correo,
      name: nombreLimpio,
      role: rol,
      // De Artiefy: no se borra de Clerk al quitarla de la academia.
      cuentaPropia: !academia.esArtiefy,
    });
  } catch (error) {
    // Sin fila en academy_users la cuenta quedaría huérfana: se deshace.
    await clerk.users.deleteUser(creado.id).catch(() => undefined);
    throw error;
  }

  let correoEnviado = true;
  try {
    await enviarCredenciales(academia, correo, nombreLimpio, password);
  } catch (error) {
    console.error('[ACADEMIAS] no se pudo enviar credenciales:', error);
    correoEnviado = false;
  }
  return { creado: true, vinculado: false, correoEnviado };
}

export async function cambiarRol(
  academyId: number,
  userId: string,
  rol: AcademyRole
) {
  await db
    .update(academyUsers)
    .set({ role: rol })
    .where(
      and(
        eq(academyUsers.academyId, academyId),
        eq(academyUsers.userId, userId)
      )
    );
}

/** Nombre de la cuenta dentro de la academia ("Editar" en Usuarios). */
export async function renombrarUsuario(
  academyId: number,
  userId: string,
  nombre: string
) {
  await db
    .update(academyUsers)
    .set({ name: nombre })
    .where(
      and(
        eq(academyUsers.academyId, academyId),
        eq(academyUsers.userId, userId)
      )
    );
}

/**
 * Activa o desactiva cuentas ("Activar / Desactivar" de Artiefy). Una cuenta
 * desactivada no puede entrar a la academia.
 */
export async function cambiarEstado(
  academyId: number,
  userIds: string[],
  activo: boolean
) {
  if (userIds.length === 0) return;
  await db
    .update(academyUsers)
    .set({ activo })
    .where(
      and(
        eq(academyUsers.academyId, academyId),
        inArray(academyUsers.userId, userIds)
      )
    );
}

/**
 * Quita la cuenta de la academia. La cuenta de Clerk solo se borra si la creó
 * una academia (cuentaPropia) y ya no queda en ninguna otra; una cuenta de
 * Artiefy vinculada solo pierde el acceso a esta academia.
 */
export async function eliminarUsuario(
  academyId: number,
  userId: string
): Promise<{ cuentaBorrada: boolean }> {
  const fila = await membresia(academyId, userId);
  if (!fila) throw new ErrorAcademia('La cuenta no es de esta academia.', 404);
  await db.delete(academyUsers).where(eq(academyUsers.id, fila.id));

  if (!fila.cuentaPropia) return { cuentaBorrada: false };
  const [otra] = await db
    .select({ id: academyUsers.id })
    .from(academyUsers)
    .where(eq(academyUsers.userId, userId))
    .limit(1);
  if (otra) return { cuentaBorrada: false };
  const clerk = await clerkClient();
  await clerk.users.deleteUser(userId);
  return { cuentaBorrada: true };
}
