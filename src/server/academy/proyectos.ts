import { and, desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  ACADEMY_PROYECTO_ESTADOS,
  academyCourses,
  academyEnrollments,
  academyProyectos,
  academyUsers,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Proyectos de los estudiantes dentro de los cursos de la academia.

type EstadoProyecto = (typeof ACADEMY_PROYECTO_ESTADOS)[number];

export async function listarProyectos(academyId: number) {
  return withRetry(() =>
    db
      .select({
        id: academyProyectos.id,
        titulo: academyProyectos.titulo,
        descripcion: academyProyectos.descripcion,
        enlace: academyProyectos.enlace,
        estado: academyProyectos.estado,
        courseId: academyProyectos.courseId,
        curso: academyCourses.title,
        userId: academyProyectos.userId,
        estudiante: academyUsers.name,
        email: academyUsers.email,
        updatedAt: academyProyectos.updatedAt,
      })
      .from(academyProyectos)
      .innerJoin(
        academyCourses,
        eq(academyCourses.id, academyProyectos.courseId)
      )
      .leftJoin(
        academyUsers,
        and(
          eq(academyUsers.userId, academyProyectos.userId),
          eq(academyUsers.academyId, academyId)
        )
      )
      .where(eq(academyProyectos.academyId, academyId))
      .orderBy(desc(academyProyectos.updatedAt))
  );
}

const enlaceValido = (v: unknown) => {
  if (typeof v !== 'string' || !v.trim()) return null;
  try {
    const url = new URL(v.trim());
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

/** Crea un proyecto; el estudiante debe estar matriculado en el curso. */
export async function crearProyecto(
  academyId: number,
  body: Record<string, unknown>
) {
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
  if (!titulo) throw new ErrorAcademia('El título es obligatorio.');
  const courseId = Number(body.courseId);
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const [matricula] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.academyId, academyId),
        eq(academyEnrollments.courseId, courseId),
        eq(academyEnrollments.userId, userId)
      )
    )
    .limit(1);
  if (!matricula) {
    throw new ErrorAcademia(
      'El estudiante debe estar matriculado en ese curso.'
    );
  }
  const [nuevo] = await db
    .insert(academyProyectos)
    .values({
      academyId,
      courseId,
      userId,
      titulo,
      descripcion:
        typeof body.descripcion === 'string' && body.descripcion.trim()
          ? body.descripcion.trim()
          : null,
      enlace: enlaceValido(body.enlace),
    })
    .returning({ id: academyProyectos.id });
  return { id: nuevo!.id, titulo };
}

async function proyectoDe(academyId: number, id: number) {
  const [fila] = await db
    .select({ id: academyProyectos.id, titulo: academyProyectos.titulo })
    .from(academyProyectos)
    .where(
      and(
        eq(academyProyectos.id, id),
        eq(academyProyectos.academyId, academyId)
      )
    )
    .limit(1);
  if (!fila) throw new ErrorAcademia('Proyecto no encontrado', 404);
  return fila;
}

export async function cambiarEstadoProyecto(
  academyId: number,
  id: number,
  estado: unknown
) {
  if (!ACADEMY_PROYECTO_ESTADOS.includes(estado as EstadoProyecto)) {
    throw new ErrorAcademia('Estado inválido.');
  }
  const proyecto = await proyectoDe(academyId, id);
  await db
    .update(academyProyectos)
    .set({ estado: estado as EstadoProyecto, updatedAt: new Date() })
    .where(eq(academyProyectos.id, id));
  return `${proyecto.titulo} → ${String(estado)}`;
}

export async function eliminarProyecto(academyId: number, id: number) {
  const proyecto = await proyectoDe(academyId, id);
  await db.delete(academyProyectos).where(eq(academyProyectos.id, id));
  return proyecto.titulo;
}
