import { eq } from 'drizzle-orm';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import nodemailer, { type Transporter } from 'nodemailer';

import { env } from '~/env';
import { db } from '~/server/db';
import { academyCorreo } from '~/server/db/schema';

import { type Academia, ErrorAcademia } from './academias';

import 'server-only';

// Correo propio de cada academia ("Conectar correo"). Si la academia conectó
// su correo, todos sus envíos salen desde él; si no, desde el correo de
// Artiefy a nombre de la academia (como siempre).
//
// La contraseña (de aplicación) se guarda cifrada con AES-256-GCM; la clave
// sale de ACADEMY_MAIL_SECRET. Nunca vuelve al navegador.

export const PROVEEDORES = {
  gmail: {
    nombre: 'Gmail / Google Workspace',
    host: 'smtp.gmail.com',
    puerto: 465,
    seguro: true,
  },
  outlook: {
    nombre: 'Outlook / Microsoft 365',
    host: 'smtp.office365.com',
    puerto: 587,
    seguro: false,
  },
  otro: { nombre: 'Otro (SMTP)', host: '', puerto: 587, seguro: false },
} as const;
export type Proveedor = keyof typeof PROVEEDORES;

const esProveedor = (v: unknown): v is Proveedor =>
  typeof v === 'string' && v in PROVEEDORES;

// ------------------------------------------------------------- Cifrado ---

function clave(): Buffer {
  if (!env.ACADEMY_MAIL_SECRET) {
    throw new ErrorAcademia(
      'Falta configurar ACADEMY_MAIL_SECRET en el servidor para conectar correos.',
      503
    );
  }
  return createHash('sha256').update(env.ACADEMY_MAIL_SECRET).digest();
}

function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', clave(), iv);
  const datos = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), datos].map((b) => b.toString('base64')).join('.');
}

function descifrar(cifrado: string): string {
  const [iv, tag, datos] = cifrado
    .split('.')
    .map((p) => Buffer.from(p, 'base64'));
  if (!iv || !tag || !datos) throw new Error('Clave de correo inválida');
  const d = createDecipheriv('aes-256-gcm', clave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]).toString('utf8');
}

// ---------------------------------------------------------- Configuración ---

/** Datos públicos del correo conectado (sin la contraseña). */
export async function obtenerCorreo(academyId: number) {
  const [fila] = await db
    .select({
      proveedor: academyCorreo.proveedor,
      host: academyCorreo.host,
      puerto: academyCorreo.puerto,
      seguro: academyCorreo.seguro,
      usuario: academyCorreo.usuario,
      remitenteNombre: academyCorreo.remitenteNombre,
      verificadoAt: academyCorreo.verificadoAt,
    })
    .from(academyCorreo)
    .where(eq(academyCorreo.academyId, academyId))
    .limit(1)
    .catch(() => []);
  return fila ?? null;
}

const crearTransporte = (c: {
  host: string;
  puerto: number;
  seguro: boolean;
  usuario: string;
  clave: string;
}) =>
  nodemailer.createTransport({
    host: c.host,
    port: c.puerto,
    secure: c.seguro,
    auth: { user: c.usuario, pass: c.clave },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });

/**
 * Conecta (o cambia) el correo de la academia: prueba la conexión con el
 * servidor SMTP y, si responde, lo guarda. Sin contraseña nueva conserva la
 * guardada (para cambiar solo el nombre del remitente).
 */
export async function conectarCorreo(
  academyId: number,
  body: Record<string, unknown>
) {
  const proveedor = esProveedor(body.proveedor) ? body.proveedor : 'otro';
  const base = PROVEEDORES[proveedor];
  const usuario = (typeof body.usuario === 'string' ? body.usuario : '')
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario)) {
    throw new ErrorAcademia('Escribe el correo que vas a conectar.');
  }
  const host =
    proveedor === 'otro'
      ? (typeof body.host === 'string' ? body.host : '').trim()
      : base.host;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
    throw new ErrorAcademia(
      'Escribe el servidor SMTP (ej. smtp.tudominio.com).'
    );
  }
  const puerto =
    proveedor === 'otro' ? Number(body.puerto) || 587 : base.puerto;
  const seguro = proveedor === 'otro' ? puerto === 465 : base.seguro;
  const remitenteNombre =
    (typeof body.remitenteNombre === 'string' ? body.remitenteNombre : '')
      .trim()
      .slice(0, 80) || null;

  let claveTexto = typeof body.clave === 'string' ? body.clave.trim() : '';
  const actual = await db
    .select({
      claveCifrada: academyCorreo.claveCifrada,
      usuario: academyCorreo.usuario,
    })
    .from(academyCorreo)
    .where(eq(academyCorreo.academyId, academyId))
    .limit(1);
  if (!claveTexto) {
    if (!actual[0] || actual[0].usuario !== usuario) {
      throw new ErrorAcademia(
        'Escribe la contraseña de aplicación del correo.'
      );
    }
    claveTexto = descifrar(actual[0].claveCifrada);
  }

  const transporte = crearTransporte({
    host,
    puerto,
    seguro,
    usuario,
    clave: claveTexto,
  });
  try {
    await transporte.verify();
  } catch (error) {
    console.error('[ACADEMIAS] correo: verificación fallida', error);
    throw new ErrorAcademia(
      'No se pudo conectar con ese correo. Revisa el correo y la contraseña de aplicación (en Gmail y Outlook no sirve la contraseña normal).'
    );
  }

  const datos = {
    proveedor,
    host,
    puerto,
    seguro,
    usuario,
    claveCifrada: cifrar(claveTexto),
    remitenteNombre,
    verificadoAt: new Date(),
    updatedAt: new Date(),
  };
  await db
    .insert(academyCorreo)
    .values({ academyId, ...datos })
    .onConflictDoUpdate({ target: academyCorreo.academyId, set: datos });
}

export async function desconectarCorreo(academyId: number) {
  await db.delete(academyCorreo).where(eq(academyCorreo.academyId, academyId));
}

// ----------------------------------------------------------- Transporte ---

// Correo de Artiefy (el de siempre) cuando la academia no conectó el suyo.
const transporteArtiefy = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'direcciongeneral@artiefy.com', pass: env.PASS },
});

const sinComillas = (s: string) => s.replace(/"/g, '');

/**
 * Transporte y remitente para los correos de la academia: su correo
 * conectado o, si no tiene (o falla al leerlo), el de Artiefy a su nombre.
 */
export async function transporteDe(
  academia: Academia
): Promise<{ transporte: Transporter; from: string }> {
  const [fila] = await db
    .select()
    .from(academyCorreo)
    .where(eq(academyCorreo.academyId, academia.id))
    .limit(1)
    .catch(() => []);
  if (fila && env.ACADEMY_MAIL_SECRET) {
    try {
      const transporte = crearTransporte({
        host: fila.host,
        puerto: fila.puerto,
        seguro: fila.seguro,
        usuario: fila.usuario,
        clave: descifrar(fila.claveCifrada),
      });
      const nombre = sinComillas(fila.remitenteNombre ?? academia.nombre);
      return { transporte, from: `"${nombre}" <${fila.usuario}>` };
    } catch (error) {
      console.error(
        '[ACADEMIAS] correo propio ilegible, uso el de Artiefy',
        error
      );
    }
  }
  return {
    transporte: transporteArtiefy,
    from: `"${sinComillas(academia.nombre)}" <direcciongeneral@artiefy.com>`,
  };
}

/** Correo de prueba al propio buzón conectado. */
export async function enviarPrueba(academia: Academia) {
  const fila = await obtenerCorreo(academia.id);
  if (!fila) throw new ErrorAcademia('La academia no tiene correo conectado.');
  const { transporte, from } = await transporteDe(academia);
  await transporte.sendMail({
    from,
    to: fila.usuario,
    subject: `Prueba de correo de ${academia.nombre}`,
    text: `Este es un correo de prueba. Desde ${fila.usuario} saldrán los correos de ${academia.nombre}.`,
  });
}
