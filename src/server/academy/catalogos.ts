import { and, asc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyCategorias,
  academyEspacios,
  academyHorarios,
  academyModalidades,
  academyNiveles,
  academyTiposCertificacion,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Catálogos de cada academia (aparte de los de Artiefy). Todos tienen la misma
// forma {id, name, description}, la misma que devuelven las APIs de catálogos
// de Artiefy, para que el modal de cursos los lea igual.

export const CATALOGOS = {
  categorias: { tabla: academyCategorias, etiqueta: 'Categorías' },
  modalidades: { tabla: academyModalidades, etiqueta: 'Modalidades' },
  niveles: { tabla: academyNiveles, etiqueta: 'Niveles' },
  horarios: { tabla: academyHorarios, etiqueta: 'Horarios' },
  espacios: { tabla: academyEspacios, etiqueta: 'Espacios' },
  'tipos-certificacion': {
    tabla: academyTiposCertificacion,
    etiqueta: 'Tipos de certificación',
  },
} as const;

export type TipoCatalogo = keyof typeof CATALOGOS;

export const esTipoCatalogo = (v: string): v is TipoCatalogo => v in CATALOGOS;

export async function listarCatalogo(academyId: number, tipo: TipoCatalogo) {
  const { tabla } = CATALOGOS[tipo];
  return withRetry(() =>
    db
      .select({
        id: tabla.id,
        name: tabla.name,
        description: tabla.description,
      })
      .from(tabla)
      .where(eq(tabla.academyId, academyId))
      .orderBy(asc(tabla.name))
  );
}

const codigoPg = (error: unknown) =>
  String((error as { cause?: { code?: string } })?.cause?.code ?? '');

function validar(body: { name?: unknown; description?: unknown }) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) throw new ErrorAcademia('El nombre es obligatorio.');
  const description =
    typeof body.description === 'string' && body.description.trim()
      ? body.description.trim()
      : null;
  return { name, description };
}

export async function crearEnCatalogo(
  academyId: number,
  tipo: TipoCatalogo,
  body: { name?: unknown; description?: unknown }
) {
  const { tabla } = CATALOGOS[tipo];
  try {
    const [fila] = await db
      .insert(tabla)
      .values({ academyId, ...validar(body) })
      .returning({ id: tabla.id });
    return fila!;
  } catch (error) {
    if (codigoPg(error) === '23505') {
      throw new ErrorAcademia('Ya existe uno con ese nombre.', 409);
    }
    throw error;
  }
}

export async function actualizarEnCatalogo(
  academyId: number,
  tipo: TipoCatalogo,
  id: number,
  body: { name?: unknown; description?: unknown }
) {
  const { tabla } = CATALOGOS[tipo];
  try {
    await db
      .update(tabla)
      .set(validar(body))
      .where(and(eq(tabla.id, id), eq(tabla.academyId, academyId)));
  } catch (error) {
    if (codigoPg(error) === '23505') {
      throw new ErrorAcademia('Ya existe uno con ese nombre.', 409);
    }
    throw error;
  }
}

export async function eliminarDeCatalogo(
  academyId: number,
  tipo: TipoCatalogo,
  id: number
) {
  const { tabla } = CATALOGOS[tipo];
  try {
    await db
      .delete(tabla)
      .where(and(eq(tabla.id, id), eq(tabla.academyId, academyId)));
  } catch (error) {
    // Categoría, modalidad o nivel usado por algún curso.
    if (codigoPg(error) === '23503') {
      throw new ErrorAcademia(
        'No se puede eliminar: hay cursos que lo usan.',
        409
      );
    }
    throw error;
  }
}
