import { eq } from 'drizzle-orm';
import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '~/env';
import { db } from '~/server/db';
import { academyAjustes } from '~/server/db/schema';

import { type Academia, ErrorAcademia } from './academias';

import 'server-only';

// Correo de cada academia ("Correo de la academia" en Configuraciones).
// Todos los correos salen desde el correo de Artiefy, con el nombre de la
// academia como remitente; si la academia configuró su correo de respuesta,
// al darle "Responder" la respuesta le llega a ella. No se pide ninguna
// contraseña: la academia solo escribe su correo.
//
// Se guarda en academy_ajustes (correo_respuesta, remitente_nombre). Sin esas
// columnas (scripts/academy_ajustes.sql) se usa el nombre de la academia y
// no hay "Responder a".

export interface CorreoAcademia {
  remitenteNombre: string | null;
  correoRespuesta: string | null;
}

const VACIO: CorreoAcademia = { remitenteNombre: null, correoRespuesta: null };

const esCorreo = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Remitente y correo de respuesta configurados (o vacíos). */
export async function obtenerCorreo(
  academyId: number
): Promise<CorreoAcademia> {
  const [fila] = await db
    .select({
      remitenteNombre: academyAjustes.remitenteNombre,
      correoRespuesta: academyAjustes.correoRespuesta,
    })
    .from(academyAjustes)
    .where(eq(academyAjustes.academyId, academyId))
    .limit(1)
    .catch(() => []);
  return fila ?? VACIO;
}

/** Guarda el nombre del remitente y el correo de respuesta. */
export async function guardarCorreo(
  academyId: number,
  body: Record<string, unknown>
): Promise<CorreoAcademia> {
  const correoRespuesta =
    (typeof body.correoRespuesta === 'string' ? body.correoRespuesta : '')
      .trim()
      .toLowerCase()
      .slice(0, 200) || null;
  if (correoRespuesta && !esCorreo(correoRespuesta)) {
    throw new ErrorAcademia('El correo de respuesta no es válido.');
  }
  const remitenteNombre =
    (typeof body.remitenteNombre === 'string' ? body.remitenteNombre : '')
      .replace(/"/g, '')
      .trim()
      .slice(0, 80) || null;

  const datos = { remitenteNombre, correoRespuesta, updatedAt: new Date() };
  await db
    .insert(academyAjustes)
    .values({ academyId, ...datos })
    .onConflictDoUpdate({ target: academyAjustes.academyId, set: datos });
  return { remitenteNombre, correoRespuesta };
}

// ----------------------------------------------------------- Transporte ---

const transporteArtiefy = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'direcciongeneral@artiefy.com', pass: env.PASS },
});

const sinComillas = (s: string) => s.replace(/"/g, '');

/**
 * Transporte, remitente y "Responder a" para los correos de la academia:
 * salen desde Artiefy con el nombre de la academia y, si la academia lo
 * configuró, las respuestas van a su correo.
 */
export async function transporteDe(academia: Academia): Promise<{
  transporte: Transporter;
  from: string;
  replyTo: string | undefined;
}> {
  const { remitenteNombre, correoRespuesta } = await obtenerCorreo(academia.id);
  const nombre = sinComillas(remitenteNombre ?? academia.nombre);
  return {
    transporte: transporteArtiefy,
    from: `"${nombre}" <direcciongeneral@artiefy.com>`,
    replyTo: correoRespuesta ?? undefined,
  };
}

/** Correo de prueba al correo de respuesta de la academia. */
export async function enviarPrueba(academia: Academia) {
  const { correoRespuesta } = await obtenerCorreo(academia.id);
  if (!correoRespuesta) {
    throw new ErrorAcademia('Primero guarda el correo de respuesta.');
  }
  const { transporte, from, replyTo } = await transporteDe(academia);
  await transporte.sendMail({
    from,
    replyTo,
    to: correoRespuesta,
    subject: `Prueba de correo de ${academia.nombre}`,
    text: `Este es un correo de prueba. Así les llegarán a tus estudiantes los correos de ${academia.nombre}. Si le das "Responder", la respuesta llega a ${correoRespuesta}.`,
  });
}
