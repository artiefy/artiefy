import { and, asc, avg, count, desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyCourseReviews,
  academyLessonComments,
  academyLessons,
  academyUsers,
} from '~/server/db/schema';

import { ErrorAcademia } from './academias';
import { estaMatriculado } from './aula';
import { type UsuarioAcademia } from './usuarios';

import 'server-only';

// Comentarios por clase y opiniones del curso del aula de una academia (como
// LessonComments y CourseComments de Artiefy). Comentan los estudiantes
// matriculados y el personal (educador / super-admin), que también responde.
// Sin scripts/academy_comentarios_aula.sql se leen vacíos.

const texto = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

async function cursoDeLeccion(academyId: number, lessonId: number) {
  const [l] = await db
    .select({ courseId: academyLessons.courseId })
    .from(academyLessons)
    .where(
      and(
        eq(academyLessons.id, lessonId),
        eq(academyLessons.academyId, academyId)
      )
    )
    .limit(1);
  if (!l) throw new ErrorAcademia('Clase no encontrada', 404);
  return l.courseId;
}

async function exigirAcceso(
  academyId: number,
  cuenta: UsuarioAcademia,
  courseId: number
) {
  if (cuenta.role !== 'estudiante') return;
  if (!(await estaMatriculado(academyId, courseId, cuenta.userId))) {
    throw new ErrorAcademia('No estás matriculado en este curso.', 403);
  }
}

// ---------------------------------------------------- Comentarios de clase

export async function listarComentariosClase(
  academyId: number,
  lessonId: number
) {
  const filas = await db
    .select({
      id: academyLessonComments.id,
      parentId: academyLessonComments.parentId,
      contenido: academyLessonComments.contenido,
      createdAt: academyLessonComments.createdAt,
      userId: academyLessonComments.userId,
      nombre: academyUsers.name,
      email: academyUsers.email,
      rol: academyUsers.role,
    })
    .from(academyLessonComments)
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
        eq(academyLessonComments.lessonId, lessonId)
      )
    )
    .orderBy(asc(academyLessonComments.createdAt))
    .catch(() => []);
  return filas.map((f) => ({
    id: f.id,
    parentId: f.parentId,
    contenido: f.contenido,
    createdAt: f.createdAt.toISOString(),
    userId: f.userId,
    nombre: f.nombre ?? f.email ?? 'Usuario',
    rol: f.rol ?? 'estudiante',
  }));
}

export async function comentarClase(
  academyId: number,
  cuenta: UsuarioAcademia,
  lessonId: number,
  body: Record<string, unknown>
) {
  await exigirAcceso(
    academyId,
    cuenta,
    await cursoDeLeccion(academyId, lessonId)
  );
  const contenido = texto(body.contenido, 2000);
  if (!contenido) throw new ErrorAcademia('Escribe tu comentario.');
  let parentId: number | null = null;
  if (body.parentId != null) {
    parentId = Number(body.parentId);
    const [padre] = await db
      .select({ id: academyLessonComments.id })
      .from(academyLessonComments)
      .where(
        and(
          eq(academyLessonComments.id, parentId),
          eq(academyLessonComments.lessonId, lessonId)
        )
      )
      .limit(1);
    if (!padre) throw new ErrorAcademia('Comentario no encontrado', 404);
  }
  await db.insert(academyLessonComments).values({
    academyId,
    lessonId,
    userId: cuenta.userId,
    parentId,
    contenido,
  });
}

/** Borra un comentario propio (el personal puede borrar cualquiera). */
export async function borrarComentarioClase(
  academyId: number,
  cuenta: UsuarioAcademia,
  id: number
) {
  const [c] = await db
    .select({ userId: academyLessonComments.userId })
    .from(academyLessonComments)
    .where(
      and(
        eq(academyLessonComments.id, id),
        eq(academyLessonComments.academyId, academyId)
      )
    )
    .limit(1);
  if (!c) throw new ErrorAcademia('Comentario no encontrado', 404);
  if (c.userId !== cuenta.userId && cuenta.role === 'estudiante') {
    throw new ErrorAcademia('No autorizado', 403);
  }
  await db
    .delete(academyLessonComments)
    .where(
      and(
        eq(academyLessonComments.academyId, academyId),
        eq(academyLessonComments.parentId, id)
      )
    );
  await db
    .delete(academyLessonComments)
    .where(eq(academyLessonComments.id, id));
}

// --------------------------------------------------- Opiniones del curso

export async function listarOpiniones(academyId: number, courseId: number) {
  const [filas, [resumen]] = await Promise.all([
    db
      .select({
        id: academyCourseReviews.id,
        userId: academyCourseReviews.userId,
        estrellas: academyCourseReviews.estrellas,
        contenido: academyCourseReviews.contenido,
        createdAt: academyCourseReviews.createdAt,
        nombre: academyUsers.name,
        email: academyUsers.email,
      })
      .from(academyCourseReviews)
      .leftJoin(
        academyUsers,
        and(
          eq(academyUsers.userId, academyCourseReviews.userId),
          eq(academyUsers.academyId, academyId)
        )
      )
      .where(
        and(
          eq(academyCourseReviews.academyId, academyId),
          eq(academyCourseReviews.courseId, courseId)
        )
      )
      .orderBy(desc(academyCourseReviews.createdAt))
      .catch(() => []),
    db
      .select({
        promedio: avg(academyCourseReviews.estrellas),
        total: count(),
      })
      .from(academyCourseReviews)
      .where(eq(academyCourseReviews.courseId, courseId))
      .catch(() => [{ promedio: null, total: 0 }]),
  ]);
  return {
    promedio: Number(resumen?.promedio ?? 0),
    total: resumen?.total ?? 0,
    opiniones: filas.map((f) => ({
      id: f.id,
      userId: f.userId,
      estrellas: f.estrellas,
      contenido: f.contenido,
      createdAt: f.createdAt.toISOString(),
      nombre: f.nombre ?? f.email ?? 'Estudiante',
    })),
  };
}

/** Opinión del estudiante (una por curso; la nueva reemplaza la anterior). */
export async function opinarCurso(
  academyId: number,
  cuenta: UsuarioAcademia,
  courseId: number,
  body: Record<string, unknown>
) {
  if (cuenta.role !== 'estudiante') {
    throw new ErrorAcademia('Solo los estudiantes opinan sobre el curso.', 403);
  }
  await exigirAcceso(academyId, cuenta, courseId);
  const estrellas = Math.round(Number(body.estrellas));
  if (!(estrellas >= 1 && estrellas <= 5)) {
    throw new ErrorAcademia('Elige de 1 a 5 estrellas.');
  }
  const datos = {
    estrellas,
    contenido: texto(body.contenido, 2000) || null,
    createdAt: new Date(),
  };
  await db
    .insert(academyCourseReviews)
    .values({ academyId, courseId, userId: cuenta.userId, ...datos })
    .onConflictDoUpdate({
      target: [academyCourseReviews.courseId, academyCourseReviews.userId],
      set: datos,
    });
}
