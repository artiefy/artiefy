import { and, desc, eq, gt, gte, inArray, lte, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '~/server/db';
import {
  academyActivities,
  academyActivityGrades,
  academyClases,
  academyCourses,
  academyEnrollments,
  academyLessonComments,
  academyLessons,
  academyUsers,
} from '~/server/db/schema';

import { listarCursos } from './cursos';

import 'server-only';

// Barra superior del aula del estudiante de una academia (como el Header de
// Artiefy): buscador con resultados al escribir y campana de notificaciones.
// Las notificaciones se arman con lo que ya pasa en la academia (clases
// nuevas, clases en vivo, notas, respuestas): no hay tabla propia; lo leído
// se recuerda en el navegador.

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function cursosDelEstudiante(
  academyId: number,
  userId: string,
  previa: boolean
): Promise<number[]> {
  if (previa) {
    return (await listarCursos(academyId))
      .filter((c) => c.visibility && c.isActive)
      .map((c) => c.id);
  }
  const filas = await db
    .select({ courseId: academyEnrollments.courseId })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.academyId, academyId),
        eq(academyEnrollments.userId, userId)
      )
    )
    .catch(() => []);
  return filas.map((f) => f.courseId);
}

// ------------------------------------------------------------ Buscador ---

export async function buscarAula(
  academyId: number,
  userId: string,
  consulta: string,
  previa = false
) {
  const q = normalizar(consulta.trim());
  if (q.length < 2) return { cursos: [], programas: [], clases: [] };
  const [cursos, mios] = await Promise.all([
    listarCursos(academyId),
    cursosDelEstudiante(academyId, userId, previa),
  ]);
  const visibles = cursos.filter((c) => c.visibility && c.isActive);
  const coincide = (...t: (string | null | undefined)[]) =>
    normalizar(t.filter(Boolean).join(' ')).includes(q);

  const programas = new Map<number, { id: number; title: string }>();
  for (const c of visibles) {
    for (const p of c.programas) {
      if (coincide(p.title)) programas.set(p.id, p);
    }
  }
  const clases = mios.length
    ? (
        await db
          .select({
            id: academyLessons.id,
            title: academyLessons.title,
            courseId: academyLessons.courseId,
            curso: academyCourses.title,
          })
          .from(academyLessons)
          .innerJoin(
            academyCourses,
            eq(academyCourses.id, academyLessons.courseId)
          )
          .where(
            and(
              eq(academyLessons.academyId, academyId),
              inArray(academyLessons.courseId, mios)
            )
          )
          .catch(() => [])
      ).filter((l) => coincide(l.title))
    : [];

  return {
    cursos: visibles
      .filter((c) =>
        coincide(c.title, c.subtitle, c.categoryName, c.instructorName)
      )
      .slice(0, 6)
      .map((c) => ({
        id: c.id,
        title: c.title,
        categoryName: c.categoryName,
        coverImageKey: c.coverImageKey,
        matriculado: mios.includes(c.id),
      })),
    programas: [...programas.values()].slice(0, 4),
    clases: clases.slice(0, 6),
  };
}

// ------------------------------------------------------- Notificaciones ---

export interface NotificacionAula {
  id: string;
  tipo: 'clase' | 'vivo' | 'nota' | 'respuesta';
  titulo: string;
  mensaje: string;
  fecha: string;
  href: string;
}

const DIAS = 86_400_000;

export async function notificacionesAula(
  academyId: number,
  userId: string,
  previa = false
): Promise<NotificacionAula[]> {
  const mios = await cursosDelEstudiante(academyId, userId, previa);
  if (mios.length === 0) return [];
  const ahora = new Date();
  const hace21 = new Date(ahora.getTime() - 21 * DIAS);
  const en7 = new Date(ahora.getTime() + 7 * DIAS);
  const autor = alias(academyLessonComments, 'comentario_padre');

  const [clases, vivo, notas, respuestas] = await Promise.all([
    db
      .select({
        id: academyLessons.id,
        title: academyLessons.title,
        courseId: academyLessons.courseId,
        curso: academyCourses.title,
        fecha: academyLessons.createdAt,
      })
      .from(academyLessons)
      .innerJoin(academyCourses, eq(academyCourses.id, academyLessons.courseId))
      .where(
        and(
          inArray(academyLessons.courseId, mios),
          gte(academyLessons.createdAt, hace21)
        )
      )
      .orderBy(desc(academyLessons.createdAt))
      .limit(10)
      .catch(() => []),
    db
      .select({
        id: academyClases.id,
        titulo: academyClases.titulo,
        courseId: academyClases.courseId,
        curso: academyCourses.title,
        inicio: academyClases.inicio,
      })
      .from(academyClases)
      .innerJoin(academyCourses, eq(academyCourses.id, academyClases.courseId))
      .where(
        and(
          inArray(academyClases.courseId, mios),
          gt(academyClases.inicio, ahora),
          lte(academyClases.inicio, en7)
        )
      )
      .limit(10)
      .catch(() => []),
    db
      .select({
        id: academyActivityGrades.id,
        nota: academyActivityGrades.nota,
        puntaje: academyActivities.puntaje,
        actividad: academyActivities.title,
        lessonId: academyActivities.lessonId,
        courseId: academyLessons.courseId,
        fecha: academyActivityGrades.updatedAt,
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
      .where(
        and(
          eq(academyActivityGrades.academyId, academyId),
          eq(academyActivityGrades.userId, userId),
          gte(academyActivityGrades.updatedAt, hace21)
        )
      )
      .orderBy(desc(academyActivityGrades.updatedAt))
      .limit(10)
      .catch(() => []),
    db
      .select({
        id: academyLessonComments.id,
        lessonId: academyLessonComments.lessonId,
        courseId: academyLessons.courseId,
        contenido: academyLessonComments.contenido,
        fecha: academyLessonComments.createdAt,
        nombre: academyUsers.name,
      })
      .from(academyLessonComments)
      .innerJoin(autor, eq(autor.id, academyLessonComments.parentId))
      .innerJoin(
        academyLessons,
        eq(academyLessons.id, academyLessonComments.lessonId)
      )
      .leftJoin(
        academyUsers,
        and(
          eq(academyUsers.userId, academyLessonComments.userId),
          eq(academyUsers.academyId, academyId)
        )
      )
      .where(
        and(
          eq(academyLessonComments.academyId, academyId),
          eq(autor.userId, userId),
          ne(academyLessonComments.userId, userId),
          gte(academyLessonComments.createdAt, hace21)
        )
      )
      .orderBy(desc(academyLessonComments.createdAt))
      .limit(10)
      .catch(() => []),
  ]);

  const claseUrl = (courseId: number, lessonId: number) =>
    `/dashboard/student/cursos/${courseId}/clases/${lessonId}`;
  const lista: NotificacionAula[] = [
    ...clases.map((c) => ({
      id: `clase-${c.id}`,
      tipo: 'clase' as const,
      titulo: 'Nueva clase disponible',
      mensaje: `${c.title} · ${c.curso}`,
      fecha: c.fecha.toISOString(),
      href: `/dashboard/student/cursos/${c.courseId}`,
    })),
    ...vivo.map((v) => ({
      id: `vivo-${v.id}`,
      tipo: 'vivo' as const,
      titulo: 'Clase en vivo próximamente',
      mensaje: `${v.titulo} · ${v.inicio.toLocaleString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Bogota',
      })}`,
      // Cuenta como "nueva" desde que falta una semana.
      fecha: new Date(v.inicio.getTime() - 7 * DIAS).toISOString(),
      href: `/dashboard/student/cursos/${v.courseId}`,
    })),
    ...notas.map((n) => ({
      id: `nota-${n.id}-${n.fecha.getTime()}`,
      tipo: 'nota' as const,
      titulo: 'Tienes una nueva calificación',
      mensaje: `${n.actividad}: ${n.nota}/${n.puntaje}`,
      fecha: n.fecha.toISOString(),
      href: claseUrl(n.courseId, n.lessonId),
    })),
    ...respuestas.map((r) => ({
      id: `respuesta-${r.id}`,
      tipo: 'respuesta' as const,
      titulo: `${r.nombre ?? 'Alguien'} respondió tu comentario`,
      mensaje: r.contenido.slice(0, 120),
      fecha: r.fecha.toISOString(),
      href: claseUrl(r.courseId, r.lessonId),
    })),
  ];
  return lista.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 20);
}
