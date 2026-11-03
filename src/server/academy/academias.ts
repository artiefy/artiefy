import { revalidateTag } from 'next/cache';

import { and, count, desc, eq } from 'drizzle-orm';

import { esSlugAcademiaValido } from '~/lib/academy/host';
import { db } from '~/server/db';
import { academies, academyUsers } from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';
import { fusionarMetadatosPublicos } from '~/server/lib/clerk-metadata';

import 'server-only';

export type Academia = typeof academies.$inferSelect;

export interface DatosAcademia {
  slug: string;
  nombre: string;
  acronimo?: string | null;
  tipo: 'personal' | 'empresa';
  documentoTipo?: string | null;
  documentoNumero?: string | null;
  esArtiefy?: boolean;
  logoKey?: string | null;
  colorPrimario?: string;
  colorFondo?: string;
  activa?: boolean;
}

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Error de validación con mensaje para mostrar al usuario. */
export class ErrorAcademia extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}

const texto = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v.trim() : null;

/** Valida y normaliza los datos que llegan del formulario. */
export function validarDatosAcademia(
  body: Record<string, unknown>,
  parcial = false
): Partial<DatosAcademia> {
  const datos: Partial<DatosAcademia> = {};

  if (!parcial || body.slug !== undefined) {
    const slug = String(body.slug ?? '')
      .trim()
      .toLowerCase();
    if (!esSlugAcademiaValido(slug)) {
      throw new ErrorAcademia(
        'La dirección debe tener de 3 a 40 letras minúsculas, números o guiones (y no puede ser una reservada).'
      );
    }
    datos.slug = slug;
  }
  if (!parcial || body.nombre !== undefined) {
    const nombre = texto(body.nombre);
    if (!nombre) throw new ErrorAcademia('El nombre es obligatorio.');
    datos.nombre = nombre;
  }
  if (!parcial || body.tipo !== undefined) {
    if (body.tipo !== 'personal' && body.tipo !== 'empresa') {
      throw new ErrorAcademia('El tipo debe ser personal o empresa.');
    }
    datos.tipo = body.tipo;
  }
  if (body.acronimo !== undefined)
    datos.acronimo = texto(body.acronimo)?.toUpperCase() ?? null;
  if (body.documentoTipo !== undefined)
    datos.documentoTipo = texto(body.documentoTipo);
  if (body.documentoNumero !== undefined)
    datos.documentoNumero = texto(body.documentoNumero);
  if (body.esArtiefy !== undefined) datos.esArtiefy = body.esArtiefy === true;
  if (body.logoKey !== undefined) datos.logoKey = texto(body.logoKey);
  for (const campo of ['colorPrimario', 'colorFondo'] as const) {
    if (body[campo] === undefined) continue;
    const color = String(body[campo]);
    if (!COLOR_RE.test(color)) {
      throw new ErrorAcademia('Los colores deben tener el formato #RRGGBB.');
    }
    datos[campo] = color.toUpperCase();
  }
  return datos;
}

export async function listarAcademias() {
  return withRetry(() =>
    db
      .select({
        id: academies.id,
        slug: academies.slug,
        nombre: academies.nombre,
        acronimo: academies.acronimo,
        esArtiefy: academies.esArtiefy,
        logoKey: academies.logoKey,
        colorPrimario: academies.colorPrimario,
        colorFondo: academies.colorFondo,
        activa: academies.activa,
        usuarios: count(academyUsers.id),
      })
      .from(academies)
      .leftJoin(academyUsers, eq(academyUsers.academyId, academies.id))
      .groupBy(academies.id)
      .orderBy(desc(academies.createdAt))
  );
}

export async function academiaPorId(id: number): Promise<Academia | null> {
  const [fila] = await withRetry(() =>
    db.select().from(academies).where(eq(academies.id, id)).limit(1)
  );
  return fila ?? null;
}

/** Academia activa del subdominio, o null. */
export async function academiaPorSlug(slug: string): Promise<Academia | null> {
  const [fila] = await withRetry(() =>
    db.select().from(academies).where(eq(academies.slug, slug)).limit(1)
  );
  return fila?.activa ? fila : null;
}

const esSlugDuplicado = (error: unknown) =>
  String((error as { cause?: { code?: string } })?.cause?.code) === '23505';

export async function crearAcademia(datos: DatosAcademia, creadoPor: string) {
  try {
    const [nueva] = await db
      .insert(academies)
      .values({ ...datos, createdBy: creadoPor })
      .returning({ id: academies.id, slug: academies.slug });
    // Por si alguien visitó esa dirección antes de crearla (quedó "no existe").
    revalidateTag('academias', 'max');
    return nueva!;
  } catch (error) {
    if (esSlugDuplicado(error)) {
      throw new ErrorAcademia('Esa dirección ya está en uso.', 409);
    }
    throw error;
  }
}

export async function actualizarAcademia(
  id: number,
  datos: Partial<DatosAcademia>
) {
  const anterior = datos.slug ? await academiaPorId(id) : null;
  try {
    await db
      .update(academies)
      .set({ ...datos, updatedAt: new Date() })
      .where(eq(academies.id, id));
  } catch (error) {
    if (esSlugDuplicado(error)) {
      throw new ErrorAcademia('Esa dirección ya está en uso.', 409);
    }
    throw error;
  }

  // La marca de cada academia está cacheada por slug (sesion.ts): se
  // invalida para que el cambio se vea de inmediato.
  revalidateTag('academias', 'max');

  // Nueva dirección: cada cuenta propia lleva academySlug en Clerk (lo usa el
  // middleware para mandarla a su academia), así que se actualiza. Las
  // cuentas vinculadas (de Artiefy) no lo llevan y no se tocan.
  if (datos.slug && anterior && anterior.slug !== datos.slug) {
    const cuentas = await db
      .select({ userId: academyUsers.userId })
      .from(academyUsers)
      .where(
        and(eq(academyUsers.academyId, id), eq(academyUsers.cuentaPropia, true))
      );
    for (const { userId } of cuentas) {
      await fusionarMetadatosPublicos(userId, { academySlug: datos.slug });
    }
  }
}
