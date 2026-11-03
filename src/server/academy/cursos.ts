import { and, desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyCategorias,
  academyCourses,
  academyEspacios,
  academyHorarios,
  academyModalidades,
  academyNiveles,
  academyTiposCertificacion,
  academyUsers,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Cursos de una academia (tabla academy_courses, aparte de los de Artiefy).
// Los datos llegan con los nombres del modal de cursos de Artiefy
// (categoryid, modalidadesid, nivelid, horario, espacios…), que se reutiliza.

export async function listarCursos(academyId: number) {
  return withRetry(() =>
    db
      .select({
        id: academyCourses.id,
        title: academyCourses.title,
        subtitle: academyCourses.subtitle,
        description: academyCourses.description,
        coverImageKey: academyCourses.coverImageKey,
        coverVideoCourseKey: academyCourses.coverVideoCourseKey,
        categoryid: academyCourses.categoriaId,
        categoryName: academyCategorias.name,
        modalidadesid: academyCourses.modalidadId,
        nivelid: academyCourses.nivelId,
        scheduleOptionId: academyCourses.horarioId,
        spaceOptionId: academyCourses.espacioId,
        certificationTypeId: academyCourses.tipoCertificacionId,
        instructor: academyCourses.instructor,
        instructorName: academyUsers.name,
        creatorId: academyCourses.creatorId,
        individualPrice: academyCourses.individualPrice,
        isActive: academyCourses.isActive,
        visibility: academyCourses.visibility,
        createdAt: academyCourses.createdAt,
      })
      .from(academyCourses)
      .leftJoin(
        academyCategorias,
        eq(academyCategorias.id, academyCourses.categoriaId)
      )
      .leftJoin(
        academyUsers,
        and(
          eq(academyUsers.userId, academyCourses.instructor),
          eq(academyUsers.academyId, academyCourses.academyId)
        )
      )
      .where(eq(academyCourses.academyId, academyId))
      .orderBy(desc(academyCourses.createdAt))
  );
}

/** Un curso de la academia con los nombres de sus catálogos e instructor. */
export async function obtenerCurso(academyId: number, id: number) {
  const [curso] = await withRetry(() =>
    db
      .select({
        id: academyCourses.id,
        title: academyCourses.title,
        subtitle: academyCourses.subtitle,
        description: academyCourses.description,
        coverImageKey: academyCourses.coverImageKey,
        categoria: academyCategorias.name,
        modalidad: academyModalidades.name,
        nivel: academyNiveles.name,
        horario: academyHorarios.name,
        espacio: academyEspacios.name,
        certificacion: academyTiposCertificacion.name,
        instructor: academyCourses.instructor,
        instructorName: academyUsers.name,
        individualPrice: academyCourses.individualPrice,
        isActive: academyCourses.isActive,
        visibility: academyCourses.visibility,
        createdAt: academyCourses.createdAt,
      })
      .from(academyCourses)
      .leftJoin(
        academyCategorias,
        eq(academyCategorias.id, academyCourses.categoriaId)
      )
      .leftJoin(
        academyModalidades,
        eq(academyModalidades.id, academyCourses.modalidadId)
      )
      .leftJoin(academyNiveles, eq(academyNiveles.id, academyCourses.nivelId))
      .leftJoin(
        academyHorarios,
        eq(academyHorarios.id, academyCourses.horarioId)
      )
      .leftJoin(
        academyEspacios,
        eq(academyEspacios.id, academyCourses.espacioId)
      )
      .leftJoin(
        academyTiposCertificacion,
        eq(academyTiposCertificacion.id, academyCourses.tipoCertificacionId)
      )
      .leftJoin(
        academyUsers,
        and(
          eq(academyUsers.userId, academyCourses.instructor),
          eq(academyUsers.academyId, academyCourses.academyId)
        )
      )
      .where(
        and(eq(academyCourses.id, id), eq(academyCourses.academyId, academyId))
      )
      .limit(1)
  );
  return curso ?? null;
}

export type CursoDetalle = NonNullable<
  Awaited<ReturnType<typeof obtenerCurso>>
>;

export interface DatosCurso {
  title: string;
  subtitle: string | null;
  description: string | null;
  coverImageKey: string | null;
  coverVideoCourseKey: string | null;
  categoriaId: number;
  modalidadId: number;
  nivelId: number;
  horarioId: number | null;
  espacioId: number | null;
  tipoCertificacionId: number | null;
  instructor: string | null;
  individualPrice: number | null;
  isActive: boolean;
  visibility: boolean;
}

const texto = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v.trim() : null;
const entero = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const CATALOGOS_DEL_CURSO = [
  ['categoriaId', academyCategorias, 'La categoría'],
  ['modalidadId', academyModalidades, 'La modalidad'],
  ['nivelId', academyNiveles, 'El nivel'],
  ['horarioId', academyHorarios, 'El horario'],
  ['espacioId', academyEspacios, 'El espacio'],
  [
    'tipoCertificacionId',
    academyTiposCertificacion,
    'El tipo de certificación',
  ],
] as const;

/**
 * Valida el cuerpo (nombres del modal de Artiefy) y comprueba que cada
 * catálogo y el instructor sean DE ESTA academia.
 */
export async function validarCurso(
  academyId: number,
  body: Record<string, unknown>
): Promise<DatosCurso> {
  const title = texto(body.title);
  if (!title) throw new ErrorAcademia('El título es obligatorio.');

  const datos: DatosCurso = {
    title,
    subtitle: texto(body.subtitle),
    description: texto(body.description),
    coverImageKey: texto(body.coverImageKey),
    coverVideoCourseKey: texto(body.coverVideoCourseKey),
    categoriaId: entero(body.categoryid) ?? 0,
    modalidadId: entero(body.modalidadesid) ?? 0,
    nivelId: entero(body.nivelid) ?? 0,
    horarioId: entero(body.horario),
    espacioId: entero(body.espacios),
    tipoCertificacionId: entero(body.certificationTypeId),
    instructor: texto(body.instructor),
    individualPrice:
      typeof body.individualPrice === 'number' && body.individualPrice >= 0
        ? Math.round(body.individualPrice)
        : null,
    isActive: body.isActive !== false,
    visibility: body.visibility !== false,
  };

  if (!datos.categoriaId || !datos.modalidadId || !datos.nivelId) {
    throw new ErrorAcademia('Categoría, modalidad y nivel son obligatorios.');
  }

  for (const [campo, tabla, nombre] of CATALOGOS_DEL_CURSO) {
    const id = datos[campo];
    if (id == null) continue;
    const [fila] = await db
      .select({ id: tabla.id })
      .from(tabla)
      .where(and(eq(tabla.id, id), eq(tabla.academyId, academyId)))
      .limit(1);
    if (!fila) throw new ErrorAcademia(`${nombre} no es de esta academia.`);
  }

  if (datos.instructor) {
    const [cuenta] = await db
      .select({ id: academyUsers.id })
      .from(academyUsers)
      .where(
        and(
          eq(academyUsers.userId, datos.instructor),
          eq(academyUsers.academyId, academyId)
        )
      )
      .limit(1);
    if (!cuenta) {
      throw new ErrorAcademia('El instructor no es de esta academia.');
    }
  }
  return datos;
}

export async function crearCurso(
  academyId: number,
  creatorId: string,
  datos: DatosCurso
) {
  const [nuevo] = await db
    .insert(academyCourses)
    .values({ ...datos, academyId, creatorId })
    .returning({ id: academyCourses.id });
  return nuevo!;
}

export async function actualizarCurso(
  academyId: number,
  id: number,
  datos: DatosCurso
) {
  const actualizados = await db
    .update(academyCourses)
    .set({ ...datos, updatedAt: new Date() })
    .where(
      and(eq(academyCourses.id, id), eq(academyCourses.academyId, academyId))
    )
    .returning({ id: academyCourses.id });
  if (actualizados.length === 0) {
    throw new ErrorAcademia('Curso no encontrado.', 404);
  }
}

export async function eliminarCurso(academyId: number, id: number) {
  await db
    .delete(academyCourses)
    .where(
      and(eq(academyCourses.id, id), eq(academyCourses.academyId, academyId))
    );
}
