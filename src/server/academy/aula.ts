import { and, asc, eq, gt, inArray, max, min, sum } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyActivities,
  academyActivityGrades,
  academyActivitySubmissions,
  academyClases,
  academyCourses,
  academyEnrollments,
  academyLessonProgress,
  academyLessons,
  academyModalidades,
  academyNiveles,
  academyProgramas,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';
import { obtenerLeccion } from './contenido';
import { listarCursos, obtenerCurso } from './cursos';

import 'server-only';

// Aula del estudiante de una academia (como /estudiantes de Artiefy): sus
// cursos con progreso, el detalle del curso con sus clases (desbloqueadas en
// orden, como en Artiefy) y la vista de cada clase con sus actividades y
// entregas. Sin las tablas de scripts/academy_aula.sql el progreso y las
// entregas se leen vacíos y no se guardan.

export interface ClaseEnCurso {
  id: number;
  title: string;
  description: string | null;
  orden: number;
  duracionMin: number | null;
  actividades: number;
  progreso: number;
  completada: boolean;
  desbloqueada: boolean;
}

/** Progreso del estudiante en un conjunto de clases (lessonId → fila). */
async function progresoDe(userId: string, lessonIds: number[]) {
  if (lessonIds.length === 0)
    return new Map<number, { progreso: number; completada: boolean }>();
  const filas = await db
    .select({
      lessonId: academyLessonProgress.lessonId,
      progreso: academyLessonProgress.progreso,
      completada: academyLessonProgress.completada,
    })
    .from(academyLessonProgress)
    .where(
      and(
        eq(academyLessonProgress.userId, userId),
        inArray(academyLessonProgress.lessonId, lessonIds)
      )
    )
    .catch(() => []);
  return new Map(filas.map((f) => [f.lessonId, f]));
}

/** Clases de un curso con el estado del estudiante (en orden). */
async function clasesConEstado(
  academyId: number,
  courseId: number,
  userId: string,
  // Vista previa del personal: todas abiertas.
  previa = false
): Promise<ClaseEnCurso[]> {
  const lecciones = await withRetry(() =>
    db
      .select({
        id: academyLessons.id,
        title: academyLessons.title,
        description: academyLessons.description,
        orden: academyLessons.orden,
        duracionMin: academyLessons.duracionMin,
      })
      .from(academyLessons)
      .where(
        and(
          eq(academyLessons.academyId, academyId),
          eq(academyLessons.courseId, courseId)
        )
      )
      .orderBy(asc(academyLessons.orden), asc(academyLessons.id))
  );
  const ids = lecciones.map((l) => l.id);
  const [progreso, actividades] = await Promise.all([
    progresoDe(userId, ids),
    ids.length
      ? db
          .select({ lessonId: academyActivities.lessonId })
          .from(academyActivities)
          .where(inArray(academyActivities.lessonId, ids))
      : Promise.resolve([]),
  ]);
  // Como en Artiefy: la primera clase está abierta y cada una se abre al
  // completar la anterior.
  let anteriorCompleta = true;
  return lecciones.map((l) => {
    const p = progreso.get(l.id);
    const clase = {
      ...l,
      actividades: actividades.filter((a) => a.lessonId === l.id).length,
      progreso: p?.progreso ?? 0,
      completada: p?.completada ?? false,
      desbloqueada: previa || anteriorCompleta,
    };
    anteriorCompleta = clase.completada;
    return clase;
  });
}

export async function estaMatriculado(
  academyId: number,
  courseId: number,
  userId: string
) {
  const [fila] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.academyId, academyId),
        eq(academyEnrollments.courseId, courseId),
        eq(academyEnrollments.userId, userId)
      )
    )
    .limit(1)
    .catch(() => []);
  return Boolean(fila);
}

// ------------------------------------------------------------- Inicio ---

/**
 * Inicio del estudiante: sus cursos (con progreso y la clase para continuar)
 * y el resto del catálogo visible de la academia.
 */
export async function inicioEstudiante(
  academyId: number,
  userId: string,
  // Vista previa (super-admin / educador): ve como suyos todos los cursos.
  previa = false
) {
  const [cursos, matriculas] = await Promise.all([
    listarCursos(academyId),
    db
      .select({ courseId: academyEnrollments.courseId })
      .from(academyEnrollments)
      .where(
        and(
          eq(academyEnrollments.academyId, academyId),
          eq(academyEnrollments.userId, userId)
        )
      )
      .catch(() => []),
  ]);
  const mios = new Set(
    previa
      ? cursos.filter((c) => c.visibility && c.isActive).map((c) => c.id)
      : matriculas.map((m) => m.courseId)
  );
  const visibles = cursos.filter((c) => c.visibility && c.isActive);

  const misCursos = await Promise.all(
    cursos
      .filter((c) => mios.has(c.id) && c.isActive)
      .map(async (c) => {
        const clases = await clasesConEstado(academyId, c.id, userId, previa);
        const hechas = clases.filter((x) => x.completada).length;
        const siguiente =
          clases.find((x) => x.desbloqueada && !x.completada) ?? null;
        return {
          ...c,
          totalClases: clases.length,
          clasesCompletadas: hechas,
          porcentaje: clases.length
            ? Math.round((hechas / clases.length) * 100)
            : 0,
          continuar: siguiente
            ? { id: siguiente.id, title: siguiente.title }
            : null,
        };
      })
  );
  // Nombres de modalidad y nivel y la próxima clase en vivo de cada curso
  // (para las tarjetas, como las de "Cursos Artie").
  const ids = visibles.map((c) => c.id);
  const [modalidades, niveles, proximas] = await Promise.all([
    db
      .select({ id: academyModalidades.id, name: academyModalidades.name })
      .from(academyModalidades)
      .where(eq(academyModalidades.academyId, academyId))
      .catch(() => []),
    db
      .select({ id: academyNiveles.id, name: academyNiveles.name })
      .from(academyNiveles)
      .where(eq(academyNiveles.academyId, academyId))
      .catch(() => []),
    ids.length
      ? db
          .select({
            courseId: academyClases.courseId,
            inicio: min(academyClases.inicio),
          })
          .from(academyClases)
          .where(
            and(
              inArray(academyClases.courseId, ids),
              gt(academyClases.inicio, new Date())
            )
          )
          .groupBy(academyClases.courseId)
          .catch(() => [])
      : Promise.resolve([]),
  ]);
  const todos = visibles.map((c) => ({
    id: c.id,
    title: c.title,
    coverImageKey: c.coverImageKey,
    categoryName: c.categoryName,
    instructorName: c.instructorName,
    rating: c.rating,
    modalidad: modalidades.find((m) => m.id === c.modalidadesid)?.name ?? null,
    nivel: niveles.find((n) => n.id === c.nivelid)?.name ?? null,
    proximaClase:
      proximas.find((p) => p.courseId === c.id)?.inicio?.toISOString() ?? null,
    matriculado: mios.has(c.id),
    createdAt: c.createdAt.toISOString(),
  }));

  return {
    misCursos: misCursos.map((c) => ({
      id: c.id,
      title: c.title,
      coverImageKey: c.coverImageKey,
      categoryName: c.categoryName,
      porcentaje: c.porcentaje,
      continuar: c.continuar,
    })),
    todos,
  };
}

export type InicioEstudiante = Awaited<ReturnType<typeof inicioEstudiante>>;

// -------------------------------------------------------------- Curso ---

/** Curso para el estudiante: ficha, clases con su estado y clases en vivo. */
export async function cursoEstudiante(
  academyId: number,
  userId: string,
  courseId: number,
  previa = false
) {
  const curso = await obtenerCurso(academyId, courseId);
  if (!curso?.isActive) return null;
  const matriculado =
    previa || (await estaMatriculado(academyId, courseId, userId));
  if (!matriculado && !curso.visibility) return null;

  const clases = await clasesConEstado(academyId, courseId, userId, previa);
  const ahora = new Date();
  const [enVivo, notas] = matriculado
    ? await Promise.all([
        db
          .select({
            id: academyClases.id,
            titulo: academyClases.titulo,
            inicio: academyClases.inicio,
            fin: academyClases.fin,
            enlace: academyClases.enlace,
          })
          .from(academyClases)
          .where(eq(academyClases.courseId, courseId))
          .orderBy(asc(academyClases.inicio))
          .catch(() => []),
        notasDelCurso(academyId, courseId, userId),
      ])
    : [[], []];

  const hechas = clases.filter((c) => c.completada).length;
  return {
    curso,
    matriculado,
    clases,
    clasesCompletadas: hechas,
    porcentaje: clases.length ? Math.round((hechas / clases.length) * 100) : 0,
    continuar: clases.find((c) => c.desbloqueada && !c.completada) ?? null,
    enVivo: enVivo.map((s) => ({
      ...s,
      inicio: s.inicio.toISOString(),
      fin: s.fin.toISOString(),
      pasada: s.fin < ahora,
    })),
    notas,
  };
}

export type CursoEstudiante = NonNullable<
  Awaited<ReturnType<typeof cursoEstudiante>>
>;

async function notasDelCurso(
  academyId: number,
  courseId: number,
  userId: string
) {
  const filas = await db
    .select({
      actividadId: academyActivities.id,
      actividad: academyActivities.title,
      clase: academyLessons.title,
      puntaje: academyActivities.puntaje,
      nota: academyActivityGrades.nota,
      comentario: academyActivityGrades.comentario,
    })
    .from(academyActivities)
    .innerJoin(
      academyLessons,
      eq(academyLessons.id, academyActivities.lessonId)
    )
    .leftJoin(
      academyActivityGrades,
      and(
        eq(academyActivityGrades.activityId, academyActivities.id),
        eq(academyActivityGrades.userId, userId)
      )
    )
    .where(
      and(
        eq(academyLessons.academyId, academyId),
        eq(academyLessons.courseId, courseId)
      )
    )
    .orderBy(asc(academyLessons.orden), asc(academyActivities.id))
    .catch(() => []);
  return filas;
}

// -------------------------------------------------------------- Clase ---

/** Una clase para el estudiante (matriculado y con la clase desbloqueada). */
export async function claseEstudiante(
  academyId: number,
  userId: string,
  lessonId: number,
  previa = false
) {
  const leccion = await obtenerLeccion(academyId, lessonId);
  if (!leccion) return null;
  if (
    !previa &&
    !(await estaMatriculado(academyId, leccion.courseId, userId))
  ) {
    throw new ErrorAcademia('No estás matriculado en este curso.', 403);
  }
  const clases = await clasesConEstado(
    academyId,
    leccion.courseId,
    userId,
    previa
  );
  const i = clases.findIndex((c) => c.id === lessonId);
  const actual = clases[i];
  if (!actual?.desbloqueada) {
    throw new ErrorAcademia('Completa la clase anterior para abrir esta.', 403);
  }

  const ids = leccion.actividades.map((a) => a.id);
  const [entregas, notas] = ids.length
    ? await Promise.all([
        db
          .select()
          .from(academyActivitySubmissions)
          .where(
            and(
              eq(academyActivitySubmissions.userId, userId),
              inArray(academyActivitySubmissions.activityId, ids)
            )
          )
          .catch(() => []),
        db
          .select({
            activityId: academyActivityGrades.activityId,
            nota: academyActivityGrades.nota,
            comentario: academyActivityGrades.comentario,
          })
          .from(academyActivityGrades)
          .where(
            and(
              eq(academyActivityGrades.userId, userId),
              inArray(academyActivityGrades.activityId, ids)
            )
          )
          .catch(() => []),
      ])
    : [[], []];

  return {
    leccion: {
      ...leccion,
      actividades: leccion.actividades.map((a) => {
        const e = entregas.find((x) => x.activityId === a.id);
        const n = notas.find((x) => x.activityId === a.id);
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          tipo: a.tipo,
          puntaje: a.puntaje,
          fechaInicio: a.fechaInicio?.toISOString() ?? null,
          fechaLimite: a.fechaLimite?.toISOString() ?? null,
          vencida: a.fechaLimite != null && a.fechaLimite < new Date(),
          entrega: e
            ? {
                texto: e.texto,
                enlace: e.enlace,
                archivoKey: e.archivoKey,
                archivoNombre: e.archivoNombre,
                entregadaAt: e.entregadaAt.toISOString(),
              }
            : null,
          nota: n ? { nota: n.nota, comentario: n.comentario } : null,
        };
      }),
    },
    clases,
    progreso: actual.progreso,
    completada: actual.completada,
    anterior: clases[i - 1] ?? null,
    siguiente: clases[i + 1] ?? null,
  };
}

export type ClaseEstudiante = NonNullable<
  Awaited<ReturnType<typeof claseEstudiante>>
>;

// ---------------------------------------------------------- Escrituras ---

/** Lección de la academia en la que el estudiante está matriculado. */
async function leccionMatriculada(
  academyId: number,
  userId: string,
  lessonId: number
) {
  const [l] = await db
    .select({ courseId: academyLessons.courseId })
    .from(academyLessons)
    .innerJoin(academyCourses, eq(academyCourses.id, academyLessons.courseId))
    .where(
      and(
        eq(academyLessons.id, lessonId),
        eq(academyLessons.academyId, academyId)
      )
    )
    .limit(1);
  if (!l) throw new ErrorAcademia('Clase no encontrada', 404);
  if (!(await estaMatriculado(academyId, l.courseId, userId))) {
    throw new ErrorAcademia('No estás matriculado en este curso.', 403);
  }
  return l;
}

/**
 * Guarda el avance en una clase. Nunca baja: se queda con el mayor progreso
 * y, una vez completada, sigue completada.
 */
export async function guardarProgreso(
  academyId: number,
  userId: string,
  lessonId: number,
  progreso: number,
  completar: boolean
) {
  await leccionMatriculada(academyId, userId, lessonId);
  const p = Math.max(0, Math.min(100, Math.round(progreso)));
  const completada = completar || p >= 100;
  const valor = completada ? 100 : p;
  const [actual] = await db
    .select({
      progreso: academyLessonProgress.progreso,
      completada: academyLessonProgress.completada,
    })
    .from(academyLessonProgress)
    .where(
      and(
        eq(academyLessonProgress.lessonId, lessonId),
        eq(academyLessonProgress.userId, userId)
      )
    )
    .limit(1);
  const nuevo = {
    progreso: Math.max(actual?.progreso ?? 0, valor),
    completada: (actual?.completada ?? false) || completada,
    updatedAt: new Date(),
  };
  await db
    .insert(academyLessonProgress)
    .values({ academyId, lessonId, userId, ...nuevo })
    .onConflictDoUpdate({
      target: [academyLessonProgress.lessonId, academyLessonProgress.userId],
      set: nuevo,
    });
  return nuevo;
}

const texto = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) || null : null;

/** Entrega (o reemplaza la entrega de) una actividad. */
export async function entregarActividad(
  academyId: number,
  userId: string,
  activityId: number,
  body: Record<string, unknown>
) {
  const [a] = await db
    .select({
      lessonId: academyActivities.lessonId,
      fechaLimite: academyActivities.fechaLimite,
    })
    .from(academyActivities)
    .where(
      and(
        eq(academyActivities.id, activityId),
        eq(academyActivities.academyId, academyId)
      )
    )
    .limit(1);
  if (!a) throw new ErrorAcademia('Actividad no encontrada', 404);
  await leccionMatriculada(academyId, userId, a.lessonId);
  if (a.fechaLimite && a.fechaLimite < new Date()) {
    throw new ErrorAcademia('La fecha límite de esta actividad ya pasó.');
  }

  const enlace = texto(body.enlace, 1000);
  if (enlace && !/^https?:\/\//i.test(enlace)) {
    throw new ErrorAcademia('El enlace debe empezar por http:// o https://');
  }
  const archivoKey = texto(body.archivoKey, 300);
  if (archivoKey && !/^uploads\/[\w./-]+$/.test(archivoKey)) {
    throw new ErrorAcademia('El archivo no es válido.');
  }
  const datos = {
    texto: texto(body.texto, 5000),
    enlace,
    archivoKey,
    archivoNombre: archivoKey ? texto(body.archivoNombre, 200) : null,
    entregadaAt: new Date(),
  };
  if (!datos.texto && !datos.enlace && !datos.archivoKey) {
    throw new ErrorAcademia(
      'Escribe tu respuesta, un enlace o adjunta un archivo.'
    );
  }
  await db
    .insert(academyActivitySubmissions)
    .values({ academyId, activityId, userId, ...datos })
    .onConflictDoUpdate({
      target: [
        academyActivitySubmissions.activityId,
        academyActivitySubmissions.userId,
      ],
      set: datos,
    });
  return { ...datos, entregadaAt: datos.entregadaAt.toISOString() };
}

// -------------------------------------------------------- Mi aprendizaje ---

/**
 * "Mi aprendizaje" (como /estudiantes/myaccount de Artiefy): sus cursos con
 * progreso y la clase para continuar, y los programas de la academia que
 * incluyen alguno de sus cursos. Con la forma de MyCoursesContent.
 */
export async function miAprendizaje(
  academyId: number,
  userId: string,
  previa = false
) {
  const [cursos, matriculas] = await Promise.all([
    listarCursos(academyId),
    db
      .select({ courseId: academyEnrollments.courseId })
      .from(academyEnrollments)
      .where(
        and(
          eq(academyEnrollments.academyId, academyId),
          eq(academyEnrollments.userId, userId)
        )
      )
      .catch(() => []),
  ]);
  const mios = new Set(
    previa
      ? cursos.filter((c) => c.visibility && c.isActive).map((c) => c.id)
      : matriculas.map((m) => m.courseId)
  );
  const lista = cursos.filter((c) => mios.has(c.id) && c.isActive);

  const courses = await Promise.all(
    lista.map(async (c) => {
      const clases = await clasesConEstado(academyId, c.id, userId, previa);
      const hechas = clases.filter((x) => x.completada).length;
      const i = clases.findIndex((x) => x.desbloqueada && !x.completada);
      const siguiente = i >= 0 ? clases[i] : null;
      return {
        id: c.id,
        title: c.title,
        coverImageKey: c.coverImageKey,
        instructorName: c.instructorName ?? 'Educador',
        progress: clases.length
          ? Math.round((hechas / clases.length) * 100)
          : 0,
        rating: c.rating,
        category: c.categoryName ? { name: c.categoryName } : null,
        continueLessonId: siguiente?.id ?? null,
        continueLessonNumber: siguiente ? i + 1 : null,
        continueLessonTitle: siguiente?.title ?? null,
      };
    })
  );

  const programas = new Map<
    number,
    { id: number; title: string; coverImageKey: string | null }
  >();
  for (const c of lista) {
    for (const p of c.programas) {
      if (!programas.has(p.id)) {
        programas.set(p.id, {
          id: p.id,
          title: p.title,
          coverImageKey: c.coverImageKey,
        });
      }
    }
  }
  return {
    courses,
    programs: [...programas.values()].map((p) => ({
      ...p,
      category: null,
      rating: 0,
    })),
  };
}

// ---------------------------------------------------------- Certificado ---

/**
 * Constancia de un curso terminado (todas sus clases completadas), como el
 * certificado de Artiefy. Fecha: la de la última clase completada. En vista
 * previa se muestra con la fecha de hoy.
 */
export async function certificadoEstudiante(
  academyId: number,
  userId: string,
  courseId: number,
  previa = false
) {
  const curso = await obtenerCurso(academyId, courseId);
  if (!curso) return null;
  if (!previa && !(await estaMatriculado(academyId, courseId, userId))) {
    return null;
  }
  const clases = await clasesConEstado(academyId, courseId, userId, previa);
  const terminado = clases.length > 0 && clases.every((c) => c.completada);
  if (!terminado && !previa) {
    throw new ErrorAcademia(
      'Completa todas las clases del curso para obtener tu constancia.',
      403
    );
  }
  const ids = clases.map((c) => c.id);
  const [ultima] = ids.length
    ? await db
        .select({ fecha: max(academyLessonProgress.updatedAt) })
        .from(academyLessonProgress)
        .where(
          and(
            eq(academyLessonProgress.userId, userId),
            inArray(academyLessonProgress.lessonId, ids)
          )
        )
        .catch(() => [])
    : [];
  return {
    curso: { id: curso.id, title: curso.title },
    educador: curso.instructorName,
    fecha: (ultima?.fecha ?? new Date()).toISOString(),
  };
}

// ------------------------------------------------------------ Programas ---

/** Programas activos de la academia con sus cursos visibles. */
async function programasConCursos(academyId: number) {
  const [programas, cursos] = await Promise.all([
    db
      .select({
        id: academyProgramas.id,
        title: academyProgramas.title,
        description: academyProgramas.description,
        isActive: academyProgramas.isActive,
      })
      .from(academyProgramas)
      .where(eq(academyProgramas.academyId, academyId))
      .orderBy(asc(academyProgramas.title))
      .catch(() => []),
    listarCursos(academyId),
  ]);
  return programas
    .filter((p) => p.isActive)
    .map((p) => ({
      ...p,
      cursos: cursos.filter(
        (c) =>
          c.visibility && c.isActive && c.programas.some((x) => x.id === p.id)
      ),
    }));
}

/** Minutos de contenido por curso (suma de la duración de sus clases). */
async function minutosPorCurso(courseIds: number[]) {
  if (courseIds.length === 0) return new Map<number, number>();
  const filas = await db
    .select({
      courseId: academyLessons.courseId,
      minutos: sum(academyLessons.duracionMin),
    })
    .from(academyLessons)
    .where(inArray(academyLessons.courseId, courseIds))
    .groupBy(academyLessons.courseId)
    .catch(() => []);
  return new Map(filas.map((f) => [f.courseId, Number(f.minutos ?? 0)]));
}

/** Tarjetas de programa del inicio (como StudentProgram de Artiefy). */
export async function programasEstudiante(academyId: number) {
  const programas = await programasConCursos(academyId);
  const minutos = await minutosPorCurso(
    programas.flatMap((p) => p.cursos.map((c) => c.id))
  );
  return programas.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    coverImageKey: p.cursos.find((c) => c.coverImageKey)?.coverImageKey ?? null,
    cursos: p.cursos.length,
    horas: Math.round(
      p.cursos.reduce((t, c) => t + (minutos.get(c.id) ?? 0), 0) / 60
    ),
    rating: p.cursos.length
      ? p.cursos.reduce((t, c) => t + c.rating, 0) / p.cursos.length
      : 0,
  }));
}

/** Detalle de un programa: sus cursos con el avance del estudiante. */
export async function programaEstudiante(
  academyId: number,
  userId: string,
  programaId: number,
  previa = false
) {
  const programa = (await programasConCursos(academyId)).find(
    (p) => p.id === programaId
  );
  if (!programa) return null;
  const matriculas = new Set(
    (
      await db
        .select({ courseId: academyEnrollments.courseId })
        .from(academyEnrollments)
        .where(
          and(
            eq(academyEnrollments.academyId, academyId),
            eq(academyEnrollments.userId, userId)
          )
        )
        .catch(() => [])
    ).map((m) => m.courseId)
  );
  const minutos = await minutosPorCurso(programa.cursos.map((c) => c.id));
  const cursos = await Promise.all(
    programa.cursos.map(async (c) => {
      const matriculado = previa || matriculas.has(c.id);
      const clases = matriculado
        ? await clasesConEstado(academyId, c.id, userId, previa)
        : [];
      const hechas = clases.filter((x) => x.completada).length;
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        coverImageKey: c.coverImageKey,
        categoryName: c.categoryName,
        instructorName: c.instructorName,
        minutos: minutos.get(c.id) ?? 0,
        matriculado,
        porcentaje: clases.length
          ? Math.round((hechas / clases.length) * 100)
          : 0,
      };
    })
  );
  const mios = cursos.filter((c) => c.matriculado);
  return {
    id: programa.id,
    title: programa.title,
    description: programa.description,
    coverImageKey: cursos.find((c) => c.coverImageKey)?.coverImageKey ?? null,
    cursos,
    horas: Math.round(cursos.reduce((t, c) => t + c.minutos, 0) / 60),
    porcentaje: mios.length
      ? Math.round(mios.reduce((t, c) => t + c.porcentaje, 0) / mios.length)
      : 0,
    matriculado: mios.length > 0,
  };
}

export type ProgramaEstudiante = NonNullable<
  Awaited<ReturnType<typeof programaEstudiante>>
>;
export type TarjetaPrograma = Awaited<
  ReturnType<typeof programasEstudiante>
>[number];
