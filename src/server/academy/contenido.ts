import { and, asc, count, eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  ACADEMY_ACTIVIDAD_TIPOS,
  academyActivities,
  academyActivityGrades,
  academyCategorias,
  academyClases,
  academyCourses,
  academyEnrollments,
  academyLessons,
  academyModalidades,
  academyParametros,
  academyUsers,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Contenido de los cursos de una academia, con los nombres de Artiefy:
// - "clases" del curso = academy_lessons (lecciones con video y actividades),
// - actividades de cada clase = academy_activities,
// - clases virtuales programadas = academy_clases (sesiones con enlace).

type TipoActividad = (typeof ACADEMY_ACTIVIDAD_TIPOS)[number];

const texto = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v.trim() : null;
const entero = (v: unknown) => {
  const n = Number(v);
  return v != null && v !== '' && Number.isFinite(n) ? Math.round(n) : null;
};
const fecha = (v: unknown) => {
  if (typeof v !== 'string' || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const enlace = (v: unknown) => {
  const t = texto(v);
  if (!t) return null;
  try {
    const url = new URL(t);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    throw new ErrorAcademia('El enlace no es una URL válida.');
  }
};

/** El curso debe ser de la academia. */
export async function cursoDeAcademia(academyId: number, courseId: number) {
  const [curso] = await db
    .select({ id: academyCourses.id, title: academyCourses.title })
    .from(academyCourses)
    .where(
      and(
        eq(academyCourses.id, courseId),
        eq(academyCourses.academyId, academyId)
      )
    )
    .limit(1);
  if (!curso) throw new ErrorAcademia('Curso no encontrado', 404);
  return curso;
}

// ---------------------------------------------------------------- Clases ---

export async function listarLecciones(academyId: number, courseId: number) {
  await cursoDeAcademia(academyId, courseId);
  const [lecciones, conteos] = await Promise.all([
    withRetry(() =>
      db
        .select()
        .from(academyLessons)
        .where(eq(academyLessons.courseId, courseId))
        .orderBy(asc(academyLessons.orden), asc(academyLessons.id))
    ),
    withRetry(() =>
      db
        .select({ lessonId: academyActivities.lessonId, n: count() })
        .from(academyActivities)
        .innerJoin(
          academyLessons,
          eq(academyLessons.id, academyActivities.lessonId)
        )
        .where(eq(academyLessons.courseId, courseId))
        .groupBy(academyActivities.lessonId)
    ),
  ]);
  return lecciones.map((l) => ({
    ...l,
    actividades: conteos.find((c) => c.lessonId === l.id)?.n ?? 0,
  }));
}

// Acepta los nombres del modal de clases de Artiefy (duration, coverImageKey,
// coverVideoKey, resourceKey, resourceNames).
function datosLeccion(body: Record<string, unknown>) {
  const title = texto(body.title);
  if (!title) throw new ErrorAcademia('El título de la clase es obligatorio.');
  return {
    title,
    description: texto(body.description),
    duracionMin: entero(body.duration ?? body.duracionMin),
    // Como Artiefy: lo que no viene en el cuerpo se deja como estaba.
    ...('coverImageKey' in body
      ? { coverImageKey: texto(body.coverImageKey) }
      : {}),
    ...('coverVideoKey' in body
      ? { coverVideoKey: texto(body.coverVideoKey) }
      : {}),
    ...('resourceKey' in body ? { resourceKey: texto(body.resourceKey) } : {}),
    ...('resourceNames' in body
      ? { resourceNames: texto(body.resourceNames) }
      : {}),
    ...('videoUrl' in body ? { videoUrl: enlace(body.videoUrl) } : {}),
  };
}

export async function crearLeccion(
  academyId: number,
  courseId: number,
  body: Record<string, unknown>
) {
  await cursoDeAcademia(academyId, courseId);
  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(academyLessons)
    .where(eq(academyLessons.courseId, courseId));
  const [nueva] = await db
    .insert(academyLessons)
    .values({ academyId, courseId, orden: total + 1, ...datosLeccion(body) })
    .returning({ id: academyLessons.id, title: academyLessons.title });
  return nueva!;
}

/** Nuevo orden de las clases del curso (ids en el orden deseado). */
export async function reordenarLecciones(
  academyId: number,
  courseId: number,
  ids: unknown
) {
  await cursoDeAcademia(academyId, courseId);
  const lista = Array.isArray(ids) ? ids.map(Number) : [];
  const propias = await db
    .select({ id: academyLessons.id })
    .from(academyLessons)
    .where(eq(academyLessons.courseId, courseId));
  const validos = lista.filter((id) => propias.some((p) => p.id === id));
  for (const [i, id] of validos.entries()) {
    await db
      .update(academyLessons)
      .set({ orden: i + 1 })
      .where(eq(academyLessons.id, id));
  }
}

/** Clase de la academia con su curso y actividades. */
export async function obtenerLeccion(academyId: number, lessonId: number) {
  const [leccion] = await withRetry(() =>
    db
      .select({
        id: academyLessons.id,
        courseId: academyLessons.courseId,
        curso: academyCourses.title,
        title: academyLessons.title,
        description: academyLessons.description,
        orden: academyLessons.orden,
        videoUrl: academyLessons.videoUrl,
        duracionMin: academyLessons.duracionMin,
        coverImageKey: academyLessons.coverImageKey,
        coverVideoKey: academyLessons.coverVideoKey,
        resourceKey: academyLessons.resourceKey,
        resourceNames: academyLessons.resourceNames,
        categoria: academyCategorias.name,
        modalidad: academyModalidades.name,
        educador: academyUsers.name,
      })
      .from(academyLessons)
      .innerJoin(academyCourses, eq(academyCourses.id, academyLessons.courseId))
      .leftJoin(
        academyCategorias,
        eq(academyCategorias.id, academyCourses.categoriaId)
      )
      .leftJoin(
        academyModalidades,
        eq(academyModalidades.id, academyCourses.modalidadId)
      )
      .leftJoin(
        academyUsers,
        and(
          eq(academyUsers.userId, academyCourses.instructor),
          eq(academyUsers.academyId, academyCourses.academyId)
        )
      )
      .where(
        and(
          eq(academyLessons.id, lessonId),
          eq(academyLessons.academyId, academyId)
        )
      )
      .limit(1)
  );
  if (!leccion) return null;
  const actividades = await withRetry(() =>
    db
      .select()
      .from(academyActivities)
      .where(eq(academyActivities.lessonId, lessonId))
      .orderBy(asc(academyActivities.id))
  );
  return { ...leccion, actividades };
}

async function leccionDe(academyId: number, lessonId: number) {
  const [fila] = await db
    .select({ id: academyLessons.id, title: academyLessons.title })
    .from(academyLessons)
    .where(
      and(
        eq(academyLessons.id, lessonId),
        eq(academyLessons.academyId, academyId)
      )
    )
    .limit(1);
  if (!fila) throw new ErrorAcademia('Clase no encontrada', 404);
  return fila;
}

export async function actualizarLeccion(
  academyId: number,
  lessonId: number,
  body: Record<string, unknown>
) {
  await leccionDe(academyId, lessonId);
  const datos = datosLeccion(body);
  await db
    .update(academyLessons)
    .set(datos)
    .where(eq(academyLessons.id, lessonId));
  return datos.title;
}

export async function eliminarLeccion(academyId: number, lessonId: number) {
  const leccion = await leccionDe(academyId, lessonId);
  await db.delete(academyLessons).where(eq(academyLessons.id, lessonId));
  return leccion.title;
}

// ----------------------------------------------------------- Actividades ---

/**
 * Campos de la actividad, como el modal "Crear actividad" de Artiefy: clase,
 * tipo, título, descripción, parámetro de evaluación y fecha máxima de
 * entrega. El peso no se escribe: se reparte igual entre las actividades del
 * parámetro (ver repartirParametro). El parámetro debe ser del curso.
 */
async function datosActividad(
  academyId: number,
  lessonId: number,
  body: Record<string, unknown>
) {
  const title = texto(body.title);
  if (!title)
    throw new ErrorAcademia('El título de la actividad es obligatorio.');
  const tipo = ACADEMY_ACTIVIDAD_TIPOS.includes(body.tipo as TipoActividad)
    ? (body.tipo as TipoActividad)
    : 'tarea';
  const puntaje = entero(body.puntaje) ?? 100;
  if (puntaje < 0) throw new ErrorAcademia('El puntaje no puede ser negativo.');
  const fechaInicio = fecha(body.fechaInicio);
  const fechaLimite = fecha(body.fechaLimite);
  if (fechaInicio && fechaLimite && fechaLimite < fechaInicio) {
    throw new ErrorAcademia(
      'La fecha de entrega debe ser después de la de inicio.'
    );
  }

  let parametroId: number | null = null;
  const pedido = entero(body.parametroId);
  if (pedido) {
    const [parametro] = await db
      .select({ id: academyParametros.id })
      .from(academyParametros)
      .innerJoin(
        academyLessons,
        eq(academyLessons.courseId, academyParametros.courseId)
      )
      .where(
        and(
          eq(academyParametros.id, pedido),
          eq(academyParametros.academyId, academyId),
          eq(academyLessons.id, lessonId)
        )
      )
      .limit(1);
    if (!parametro) {
      throw new ErrorAcademia('El parámetro no es de este curso.');
    }
    parametroId = parametro.id;
  }

  return {
    title,
    description: texto(body.description),
    tipo,
    fechaInicio,
    fechaLimite,
    puntaje,
    calificable: parametroId !== null,
    parametroId,
  };
}

/**
 * Reparte el 100% del parámetro en partes iguales entre sus actividades
 * (1 → 100%, 2 → 50% y 50%, 3 → 33,33%…), como Artiefy.
 */
async function repartirParametro(parametroId: number | null) {
  if (parametroId == null) return;
  const actividades = await db
    .select({ id: academyActivities.id })
    .from(academyActivities)
    .where(eq(academyActivities.parametroId, parametroId));
  if (actividades.length === 0) return;
  const peso = Math.round((100 / actividades.length) * 100) / 100;
  await db
    .update(academyActivities)
    .set({ porcentaje: peso })
    .where(eq(academyActivities.parametroId, parametroId));
}

export async function crearActividad(
  academyId: number,
  lessonId: number,
  body: Record<string, unknown>
) {
  await leccionDe(academyId, lessonId);
  const datos = await datosActividad(academyId, lessonId, body);
  const [nueva] = await db
    .insert(academyActivities)
    .values({ academyId, lessonId, ...datos })
    .returning({ id: academyActivities.id, title: academyActivities.title });
  await repartirParametro(datos.parametroId);
  return nueva!;
}

async function leccionConCurso(academyId: number, lessonId: number) {
  const [fila] = await db
    .select({ id: academyLessons.id, courseId: academyLessons.courseId })
    .from(academyLessons)
    .where(
      and(
        eq(academyLessons.id, lessonId),
        eq(academyLessons.academyId, academyId)
      )
    )
    .limit(1);
  return fila ?? null;
}

async function actividadDe(academyId: number, id: number) {
  const [fila] = await db
    .select({
      id: academyActivities.id,
      title: academyActivities.title,
      lessonId: academyActivities.lessonId,
      parametroId: academyActivities.parametroId,
    })
    .from(academyActivities)
    .where(
      and(
        eq(academyActivities.id, id),
        eq(academyActivities.academyId, academyId)
      )
    )
    .limit(1);
  if (!fila) throw new ErrorAcademia('Actividad no encontrada', 404);
  return fila;
}

export async function actualizarActividad(
  academyId: number,
  id: number,
  body: Record<string, unknown>
) {
  const actual = await actividadDe(academyId, id);
  // La clase puede cambiar (debe ser del mismo curso).
  const lessonId = entero(body.lessonId) ?? actual.lessonId;
  if (lessonId !== actual.lessonId) {
    const [destino, origen] = await Promise.all([
      leccionConCurso(academyId, lessonId),
      leccionConCurso(academyId, actual.lessonId),
    ]);
    if (destino?.courseId !== origen?.courseId) {
      throw new ErrorAcademia('La clase no es de este curso.');
    }
  }
  const datos = await datosActividad(academyId, lessonId, body);
  await db
    .update(academyActivities)
    .set({ ...datos, lessonId })
    .where(eq(academyActivities.id, id));
  await repartirParametro(datos.parametroId);
  if (actual.parametroId !== datos.parametroId) {
    await repartirParametro(actual.parametroId);
  }
  return datos.title;
}

export async function eliminarActividad(academyId: number, id: number) {
  const actividad = await actividadDe(academyId, id);
  await db.delete(academyActivities).where(eq(academyActivities.id, id));
  await repartirParametro(actividad.parametroId);
  return actividad.title;
}

// ------------------------------------------------- Clases virtuales -------

export async function listarSesiones(academyId: number, courseId: number) {
  await cursoDeAcademia(academyId, courseId);
  return withRetry(() =>
    db
      .select({
        id: academyClases.id,
        titulo: academyClases.titulo,
        inicio: academyClases.inicio,
        fin: academyClases.fin,
        enlace: academyClases.enlace,
        lessonId: academyClases.lessonId,
        leccion: academyLessons.title,
      })
      .from(academyClases)
      .leftJoin(academyLessons, eq(academyLessons.id, academyClases.lessonId))
      .where(eq(academyClases.courseId, courseId))
      .orderBy(asc(academyClases.inicio))
  );
}

export async function crearSesion(
  academyId: number,
  courseId: number,
  body: Record<string, unknown>
) {
  await cursoDeAcademia(academyId, courseId);
  const titulo = texto(body.titulo);
  if (!titulo) throw new ErrorAcademia('El título es obligatorio.');
  const inicio = fecha(body.inicio);
  const fin = fecha(body.fin);
  if (!inicio || !fin) throw new ErrorAcademia('Indica inicio y fin.');
  if (fin <= inicio) {
    throw new ErrorAcademia('El fin debe ser después del inicio.');
  }
  // La clase enlazada (opcional) debe ser del mismo curso.
  let lessonId: number | null = null;
  const pedido = entero(body.lessonId);
  if (pedido != null) {
    const [l] = await db
      .select({ id: academyLessons.id })
      .from(academyLessons)
      .where(
        and(
          eq(academyLessons.id, pedido),
          eq(academyLessons.courseId, courseId)
        )
      )
      .limit(1);
    lessonId = l?.id ?? null;
  }
  const [nueva] = await db
    .insert(academyClases)
    .values({
      academyId,
      courseId,
      lessonId,
      titulo,
      inicio,
      fin,
      enlace: enlace(body.enlace),
    })
    .returning({ id: academyClases.id });
  return { id: nueva!.id, titulo };
}

export async function eliminarSesion(academyId: number, id: number) {
  const [fila] = await db
    .select({ id: academyClases.id, titulo: academyClases.titulo })
    .from(academyClases)
    .where(
      and(eq(academyClases.id, id), eq(academyClases.academyId, academyId))
    )
    .limit(1);
  if (!fila) throw new ErrorAcademia('Clase virtual no encontrada', 404);
  await db.delete(academyClases).where(eq(academyClases.id, id));
  return fila.titulo;
}

// ------------------------------------------ Estudiantes y notas del curso ---

/**
 * Estudiantes matriculados en el curso con sus notas por actividad (como la
 * tabla de estudiantes del detalle de curso de Artiefy).
 */
export async function estudiantesDelCurso(academyId: number, courseId: number) {
  await cursoDeAcademia(academyId, courseId);
  const [matriculados, actividades, notas] = await Promise.all([
    withRetry(() =>
      db
        .select({
          userId: academyEnrollments.userId,
          completed: academyEnrollments.completed,
          enrolledAt: academyEnrollments.enrolledAt,
          name: academyUsers.name,
          email: academyUsers.email,
          activo: academyUsers.activo,
        })
        .from(academyEnrollments)
        .leftJoin(
          academyUsers,
          and(
            eq(academyUsers.userId, academyEnrollments.userId),
            eq(academyUsers.academyId, academyId)
          )
        )
        .where(eq(academyEnrollments.courseId, courseId))
        .orderBy(asc(academyUsers.name))
    ),
    withRetry(() =>
      db
        .select({
          id: academyActivities.id,
          title: academyActivities.title,
          description: academyActivities.description,
          tipo: academyActivities.tipo,
          fechaLimite: academyActivities.fechaLimite,
          fechaInicio: academyActivities.fechaInicio,
          puntaje: academyActivities.puntaje,
          calificable: academyActivities.calificable,
          parametroId: academyActivities.parametroId,
          porcentaje: academyActivities.porcentaje,
          lessonId: academyActivities.lessonId,
          leccion: academyLessons.title,
          orden: academyLessons.orden,
        })
        .from(academyActivities)
        .innerJoin(
          academyLessons,
          eq(academyLessons.id, academyActivities.lessonId)
        )
        .where(eq(academyLessons.courseId, courseId))
        .orderBy(asc(academyLessons.orden), asc(academyActivities.id))
    ),
    withRetry(() =>
      db
        .select({
          activityId: academyActivityGrades.activityId,
          userId: academyActivityGrades.userId,
          nota: academyActivityGrades.nota,
        })
        .from(academyActivityGrades)
        .innerJoin(
          academyActivities,
          eq(academyActivities.id, academyActivityGrades.activityId)
        )
        .innerJoin(
          academyLessons,
          eq(academyLessons.id, academyActivities.lessonId)
        )
        .where(eq(academyLessons.courseId, courseId))
    ),
  ]);
  return {
    actividades,
    estudiantes: matriculados.map((m) => ({
      ...m,
      notas: Object.fromEntries(
        notas
          .filter((n) => n.userId === m.userId)
          .map((n) => [n.activityId, n.nota])
      ) as Record<number, number>,
    })),
  };
}

/** Guarda (o borra, con nota null) la nota de un estudiante en una actividad. */
export async function guardarNota(
  academyId: number,
  courseId: number,
  body: Record<string, unknown>
) {
  await cursoDeAcademia(academyId, courseId);
  const activityId = Number(body.activityId);
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const [actividad] = await db
    .select({ id: academyActivities.id, puntaje: academyActivities.puntaje })
    .from(academyActivities)
    .innerJoin(
      academyLessons,
      eq(academyLessons.id, academyActivities.lessonId)
    )
    .where(
      and(
        eq(academyActivities.id, activityId),
        eq(academyLessons.courseId, courseId)
      )
    )
    .limit(1);
  if (!actividad) throw new ErrorAcademia('Actividad no encontrada', 404);
  const [matricula] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.courseId, courseId),
        eq(academyEnrollments.userId, userId)
      )
    )
    .limit(1);
  if (!matricula) {
    throw new ErrorAcademia('El estudiante no está matriculado en el curso.');
  }

  if (body.nota == null || body.nota === '') {
    await db
      .delete(academyActivityGrades)
      .where(
        and(
          eq(academyActivityGrades.activityId, activityId),
          eq(academyActivityGrades.userId, userId)
        )
      );
    return;
  }
  const nota = Number(body.nota);
  if (!Number.isFinite(nota) || nota < 0 || nota > actividad.puntaje) {
    throw new ErrorAcademia(
      `La nota debe estar entre 0 y ${actividad.puntaje}.`
    );
  }
  await db
    .insert(academyActivityGrades)
    .values({ academyId, activityId, userId, nota })
    .onConflictDoUpdate({
      target: [academyActivityGrades.activityId, academyActivityGrades.userId],
      set: { nota, updatedAt: new Date() },
    });
}

/** Quita la matrícula de un estudiante en el curso (sus notas se borran). */
export async function quitarDelCurso(
  academyId: number,
  courseId: number,
  userId: string
) {
  await cursoDeAcademia(academyId, courseId);
  await db
    .delete(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.courseId, courseId),
        eq(academyEnrollments.userId, userId)
      )
    );
  const ids = (
    await db
      .select({ id: academyActivities.id })
      .from(academyActivities)
      .innerJoin(
        academyLessons,
        eq(academyLessons.id, academyActivities.lessonId)
      )
      .where(eq(academyLessons.courseId, courseId))
  ).map((a) => a.id);
  if (ids.length > 0) {
    await db
      .delete(academyActivityGrades)
      .where(
        and(
          eq(academyActivityGrades.userId, userId),
          inArray(academyActivityGrades.activityId, ids)
        )
      );
  }
}

/** Marca (o desmarca) como completado el curso para varios estudiantes. */
export async function marcarCompletado(
  academyId: number,
  courseId: number,
  userIds: string[],
  completed: boolean
) {
  await cursoDeAcademia(academyId, courseId);
  if (userIds.length === 0) return;
  await db
    .update(academyEnrollments)
    .set({ completed })
    .where(
      and(
        eq(academyEnrollments.courseId, courseId),
        inArray(academyEnrollments.userId, userIds)
      )
    );
}
