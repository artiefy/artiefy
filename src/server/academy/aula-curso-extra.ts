import { and, asc, desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyCourseForum,
  academyProyectos,
  academyUsers,
} from '~/server/db/schema';

import { ErrorAcademia } from './academias';
import { estaMatriculado } from './aula';
import { type UsuarioAcademia } from './usuarios';

import 'server-only';

// Foro y proyectos de un curso en el aula del estudiante (como las pestañas
// Foro y Proyectos del curso en Artiefy). El foro es de todos los del curso;
// los proyectos son los del estudiante (academy_proyectos, los mismos que ve
// el super-admin en Proyectos).

const texto = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

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

// ---------------------------------------------------------------- Foro ---

export async function listarForo(academyId: number, courseId: number) {
  const filas = await db
    .select({
      id: academyCourseForum.id,
      parentId: academyCourseForum.parentId,
      titulo: academyCourseForum.titulo,
      contenido: academyCourseForum.contenido,
      createdAt: academyCourseForum.createdAt,
      userId: academyCourseForum.userId,
      nombre: academyUsers.name,
      email: academyUsers.email,
      rol: academyUsers.role,
    })
    .from(academyCourseForum)
    .leftJoin(
      academyUsers,
      and(
        eq(academyUsers.userId, academyCourseForum.userId),
        eq(academyUsers.academyId, academyId)
      )
    )
    .where(
      and(
        eq(academyCourseForum.academyId, academyId),
        eq(academyCourseForum.courseId, courseId)
      )
    )
    .orderBy(asc(academyCourseForum.createdAt))
    .catch(() => []);
  return filas.map((f) => ({
    id: f.id,
    parentId: f.parentId,
    titulo: f.titulo,
    contenido: f.contenido,
    createdAt: f.createdAt.toISOString(),
    userId: f.userId,
    nombre: f.nombre ?? f.email ?? 'Usuario',
    rol: f.rol ?? 'estudiante',
  }));
}

export async function publicarForo(
  academyId: number,
  cuenta: UsuarioAcademia,
  courseId: number,
  body: Record<string, unknown>
) {
  await exigirAcceso(academyId, cuenta, courseId);
  const contenido = texto(body.contenido, 4000);
  if (!contenido) throw new ErrorAcademia('Escribe tu mensaje.');
  let parentId: number | null = null;
  let titulo: string | null = null;
  if (body.parentId != null) {
    parentId = Number(body.parentId);
    const [tema] = await db
      .select({ id: academyCourseForum.id })
      .from(academyCourseForum)
      .where(
        and(
          eq(academyCourseForum.id, parentId),
          eq(academyCourseForum.courseId, courseId)
        )
      )
      .limit(1);
    if (!tema) throw new ErrorAcademia('Tema no encontrado', 404);
  } else {
    titulo = texto(body.titulo, 200);
    if (!titulo) throw new ErrorAcademia('Escribe el título del tema.');
  }
  await db.insert(academyCourseForum).values({
    academyId,
    courseId,
    userId: cuenta.userId,
    parentId,
    titulo,
    contenido,
  });
}

/** Borra un mensaje propio (el personal, cualquiera) y sus respuestas. */
export async function borrarForo(
  academyId: number,
  cuenta: UsuarioAcademia,
  id: number
) {
  const [m] = await db
    .select({ userId: academyCourseForum.userId })
    .from(academyCourseForum)
    .where(
      and(
        eq(academyCourseForum.id, id),
        eq(academyCourseForum.academyId, academyId)
      )
    )
    .limit(1);
  if (!m) throw new ErrorAcademia('Mensaje no encontrado', 404);
  if (m.userId !== cuenta.userId && cuenta.role === 'estudiante') {
    throw new ErrorAcademia('No autorizado', 403);
  }
  await db
    .delete(academyCourseForum)
    .where(
      and(
        eq(academyCourseForum.academyId, academyId),
        eq(academyCourseForum.parentId, id)
      )
    );
  await db.delete(academyCourseForum).where(eq(academyCourseForum.id, id));
}

// ----------------------------------------------------------- Proyectos ---

export async function misProyectos(
  academyId: number,
  userId: string,
  courseId: number
) {
  const filas = await db
    .select({
      id: academyProyectos.id,
      titulo: academyProyectos.titulo,
      descripcion: academyProyectos.descripcion,
      enlace: academyProyectos.enlace,
      estado: academyProyectos.estado,
      updatedAt: academyProyectos.updatedAt,
    })
    .from(academyProyectos)
    .where(
      and(
        eq(academyProyectos.academyId, academyId),
        eq(academyProyectos.courseId, courseId),
        eq(academyProyectos.userId, userId)
      )
    )
    .orderBy(desc(academyProyectos.updatedAt))
    .catch(() => []);
  return filas.map((f) => ({ ...f, updatedAt: f.updatedAt.toISOString() }));
}

/**
 * Crea o edita un proyecto propio. El estudiante lo deja "en progreso" o lo
 * marca "entregado"; "aprobado" solo lo pone la academia (y ya no se edita).
 */
export async function guardarProyecto(
  academyId: number,
  cuenta: UsuarioAcademia,
  courseId: number,
  body: Record<string, unknown>
) {
  if (cuenta.role !== 'estudiante') {
    throw new ErrorAcademia('Solo los estudiantes registran proyectos.', 403);
  }
  await exigirAcceso(academyId, cuenta, courseId);
  const titulo = texto(body.titulo, 200);
  if (!titulo) throw new ErrorAcademia('Escribe el título del proyecto.');
  const enlace = texto(body.enlace, 1000) || null;
  if (enlace && !/^https?:\/\//i.test(enlace)) {
    throw new ErrorAcademia('El enlace debe empezar por http:// o https://');
  }
  const datos = {
    titulo,
    descripcion: texto(body.descripcion, 4000) || null,
    enlace,
    estado:
      body.entregar === true
        ? ('entregado' as const)
        : ('en progreso' as const),
    updatedAt: new Date(),
  };
  if (body.id != null) {
    const id = Number(body.id);
    const [actual] = await db
      .select({ estado: academyProyectos.estado })
      .from(academyProyectos)
      .where(
        and(
          eq(academyProyectos.id, id),
          eq(academyProyectos.academyId, academyId),
          eq(academyProyectos.userId, cuenta.userId)
        )
      )
      .limit(1);
    if (!actual) throw new ErrorAcademia('Proyecto no encontrado', 404);
    if (actual.estado === 'aprobado') {
      throw new ErrorAcademia(
        'El proyecto ya fue aprobado; no se puede editar.'
      );
    }
    await db
      .update(academyProyectos)
      .set(datos)
      .where(eq(academyProyectos.id, id));
    return;
  }
  await db
    .insert(academyProyectos)
    .values({ academyId, courseId, userId: cuenta.userId, ...datos });
}
