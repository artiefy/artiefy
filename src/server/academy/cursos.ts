import { and, countDistinct, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyCategorias,
  academyCourseInstructors,
  academyCourses,
  academyEnrollments,
  academyEspacios,
  academyHorarios,
  academyModalidades,
  academyNiveles,
  academyProgramaCursos,
  academyProgramas,
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
  const cursos = await listarCursosSinProgramas(academyId);
  // Programas de cada curso, como en Artiefy (separa "Cursos Independientes"
  // de "Cursos en Programas"). Si la tabla aún no existe, quedan sin programas.
  const ids = cursos.map((c) => c.id);
  const filas =
    ids.length === 0
      ? []
      : await withRetry(() =>
          db
            .select({
              courseId: academyProgramaCursos.courseId,
              id: academyProgramas.id,
              title: academyProgramas.title,
            })
            .from(academyProgramaCursos)
            .innerJoin(
              academyProgramas,
              eq(academyProgramas.id, academyProgramaCursos.programaId)
            )
            .where(
              and(
                eq(academyProgramas.academyId, academyId),
                inArray(academyProgramaCursos.courseId, ids)
              )
            )
        ).catch(() => []);
  const extras = await extrasDeCursos(academyId, ids);
  return cursos.map((c) => ({
    ...c,
    ...extras(c.id, c.instructor),
    programas: filas
      .filter((f) => f.courseId === c.id)
      .map(({ id, title }) => ({ id, title })),
  }));
}

/**
 * Instructores adicionales (academy_course_instructors) y rating de los
 * cursos. Si el SQL academy_cursos_detalle.sql aún no se corrió, los cursos
 * quedan con su instructor principal y rating 0.
 */
async function extrasDeCursos(academyId: number, ids: number[]) {
  const [instructores, ratings] =
    ids.length === 0
      ? [[], []]
      : await Promise.all([
          withRetry(() =>
            db
              .select({
                courseId: academyCourseInstructors.courseId,
                userId: academyCourseInstructors.userId,
              })
              .from(academyCourseInstructors)
              .where(inArray(academyCourseInstructors.courseId, ids))
          ).catch(() => []),
          withRetry(() =>
            db.execute(
              sql`select id, rating from academy_courses where academy_id = ${academyId}`
            )
          )
            .then((r) => r.rows as { id: number; rating: number | null }[])
            .catch(() => []),
        ]);
  return (id: number, principal: string | null) => ({
    instructores: [
      ...(principal ? [principal] : []),
      ...instructores
        .filter((f) => f.courseId === id && f.userId !== principal)
        .map((f) => f.userId),
    ],
    rating: Number(ratings.find((r) => Number(r.id) === id)?.rating ?? 0),
  });
}

/** Estudiantes distintos matriculados en algún curso de la academia. */
export async function totalEstudiantesInscritos(academyId: number) {
  const [fila] = await withRetry(() =>
    db
      .select({ total: countDistinct(academyEnrollments.userId) })
      .from(academyEnrollments)
      .where(eq(academyEnrollments.academyId, academyId))
  );
  return fila?.total ?? 0;
}

function listarCursosSinProgramas(academyId: number) {
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
  if (!curso) return null;
  const extras = await extrasDeCursos(academyId, [curso.id]);
  return { ...curso, ...extras(curso.id, curso.instructor) };
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
  // Fuera de academy_courses (ver guardarExtras).
  instructores: string[];
  rating: number;
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
    instructor: null,
    individualPrice:
      typeof body.individualPrice === 'number' && body.individualPrice >= 0
        ? Math.round(body.individualPrice)
        : null,
    isActive: body.isActive !== false,
    visibility: body.visibility !== false,
    // Como Artiefy: varios instructores; el primero es el principal.
    instructores: [
      ...new Set(
        (Array.isArray(body.instructors) ? body.instructors : [body.instructor])
          .map(texto)
          .filter((v): v is string => v !== null)
      ),
    ],
    rating:
      typeof body.rating === 'number' && body.rating >= 0 && body.rating <= 5
        ? body.rating
        : 0,
  };
  datos.instructor = datos.instructores[0] ?? null;

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

  if (datos.instructores.length > 0) {
    const cuentas = await db
      .select({ userId: academyUsers.userId })
      .from(academyUsers)
      .where(
        and(
          inArray(academyUsers.userId, datos.instructores),
          eq(academyUsers.academyId, academyId)
        )
      );
    if (cuentas.length !== datos.instructores.length) {
      throw new ErrorAcademia('Algún instructor no es de esta academia.');
    }
  }
  return datos;
}

export async function crearCurso(
  academyId: number,
  creatorId: string,
  datos: DatosCurso
) {
  const { instructores, rating, ...columnas } = datos;
  const [nuevo] = await db
    .insert(academyCourses)
    .values({ ...columnas, academyId, creatorId })
    .returning({ id: academyCourses.id });
  await guardarExtras(nuevo!.id, instructores, rating);
  return nuevo!;
}

export async function actualizarCurso(
  academyId: number,
  id: number,
  datos: DatosCurso
) {
  const { instructores, rating, ...columnas } = datos;
  const actualizados = await db
    .update(academyCourses)
    .set({ ...columnas, updatedAt: new Date() })
    .where(
      and(eq(academyCourses.id, id), eq(academyCourses.academyId, academyId))
    )
    .returning({ id: academyCourses.id });
  if (actualizados.length === 0) {
    throw new ErrorAcademia('Curso no encontrado.', 404);
  }
  await guardarExtras(id, instructores, rating);
}

/**
 * Rating e instructores adicionales. El rating se escribe aparte (columna del
 * SQL academy_cursos_detalle.sql) para que, sin ese SQL, el curso igual se
 * guarde. Con instructores adicionales el SQL sí es necesario: sin la tabla,
 * el error (42P01) llega a la pantalla como "falta correr el SQL".
 */
async function guardarExtras(
  courseId: number,
  instructores: string[],
  rating: number
) {
  await db
    .execute(
      sql`update academy_courses set rating = ${rating} where id = ${courseId}`
    )
    .catch(() => undefined);
  await guardarAdicionales(courseId, instructores);
}

async function guardarAdicionales(courseId: number, instructores: string[]) {
  const adicionales = instructores.slice(1);
  const reemplazar = async () => {
    await db
      .delete(academyCourseInstructors)
      .where(eq(academyCourseInstructors.courseId, courseId));
    if (adicionales.length > 0) {
      await db
        .insert(academyCourseInstructors)
        .values(adicionales.map((userId) => ({ courseId, userId })));
    }
  };
  if (adicionales.length > 0) await reemplazar();
  else await reemplazar().catch(() => undefined);
}

/**
 * Cambia solo los instructores del curso (chips del detalle). El primero
 * queda como principal; debe quedar al menos uno, como en Artiefy.
 */
export async function actualizarInstructores(
  academyId: number,
  courseId: number,
  body: unknown
) {
  const lista = (
    Array.isArray((body as { instructors?: unknown })?.instructors)
      ? (body as { instructors: unknown[] }).instructors
      : []
  )
    .map(texto)
    .filter((v): v is string => v !== null);
  const instructores = [...new Set(lista)];
  if (instructores.length === 0) {
    throw new ErrorAcademia('Debe haber al menos un instructor');
  }
  const cuentas = await db
    .select({ userId: academyUsers.userId })
    .from(academyUsers)
    .where(
      and(
        inArray(academyUsers.userId, instructores),
        eq(academyUsers.academyId, academyId)
      )
    );
  if (cuentas.length !== instructores.length) {
    throw new ErrorAcademia('Algún instructor no es de esta academia.');
  }
  const actualizados = await db
    .update(academyCourses)
    .set({ instructor: instructores[0]!, updatedAt: new Date() })
    .where(
      and(
        eq(academyCourses.id, courseId),
        eq(academyCourses.academyId, academyId)
      )
    )
    .returning({ id: academyCourses.id });
  if (actualizados.length === 0) {
    throw new ErrorAcademia('Curso no encontrado.', 404);
  }
  await guardarAdicionales(courseId, instructores);
}

export async function eliminarCurso(academyId: number, id: number) {
  await db
    .delete(academyCourses)
    .where(
      and(eq(academyCourses.id, id), eq(academyCourses.academyId, academyId))
    );
}
