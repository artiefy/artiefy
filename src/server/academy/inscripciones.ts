import { and, desc, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  ACADEMY_INSCRIPCION_ESTADOS,
  academyCourses,
  academyInscripciones,
} from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

import { ErrorAcademia } from './academias';

import 'server-only';

// Formulario de inscripción público de una academia y sus respuestas.

type EstadoInscripcion = (typeof ACADEMY_INSCRIPCION_ESTADOS)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texto = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

export async function listarInscripciones(academyId: number) {
  return withRetry(() =>
    db
      .select({
        id: academyInscripciones.id,
        nombre: academyInscripciones.nombre,
        email: academyInscripciones.email,
        telefono: academyInscripciones.telefono,
        documento: academyInscripciones.documento,
        courseId: academyInscripciones.courseId,
        curso: academyCourses.title,
        mensaje: academyInscripciones.mensaje,
        estado: academyInscripciones.estado,
        createdAt: academyInscripciones.createdAt,
      })
      .from(academyInscripciones)
      .leftJoin(
        academyCourses,
        eq(academyCourses.id, academyInscripciones.courseId)
      )
      .where(eq(academyInscripciones.academyId, academyId))
      .orderBy(desc(academyInscripciones.createdAt))
  );
}

/** Respuesta pública del formulario (sin sesión). */
export async function recibirInscripcion(
  academyId: number,
  body: Record<string, unknown>
) {
  const nombre = texto(body.nombre, 120);
  const email = texto(body.email, 160)?.toLowerCase() ?? null;
  if (!nombre) throw new ErrorAcademia('Escribe tu nombre.');
  if (!email || !EMAIL_RE.test(email)) {
    throw new ErrorAcademia('Escribe un correo válido.');
  }

  // Solo cursos visibles y activos de esta academia.
  let courseId: number | null = null;
  if (body.courseId != null && body.courseId !== '') {
    const [curso] = await db
      .select({ id: academyCourses.id })
      .from(academyCourses)
      .where(
        and(
          eq(academyCourses.id, Number(body.courseId)),
          eq(academyCourses.academyId, academyId),
          eq(academyCourses.visibility, true),
          eq(academyCourses.isActive, true)
        )
      )
      .limit(1);
    courseId = curso?.id ?? null;
  }

  await db.insert(academyInscripciones).values({
    academyId,
    nombre,
    email,
    telefono: texto(body.telefono, 40),
    documento: texto(body.documento, 40),
    courseId,
    mensaje: texto(body.mensaje, 1000),
  });
}

async function inscripcionDe(academyId: number, id: number) {
  const [fila] = await db
    .select({ id: academyInscripciones.id, email: academyInscripciones.email })
    .from(academyInscripciones)
    .where(
      and(
        eq(academyInscripciones.id, id),
        eq(academyInscripciones.academyId, academyId)
      )
    )
    .limit(1);
  if (!fila) throw new ErrorAcademia('Respuesta no encontrada', 404);
  return fila;
}

export async function cambiarEstadoInscripcion(
  academyId: number,
  id: number,
  estado: unknown
) {
  if (!ACADEMY_INSCRIPCION_ESTADOS.includes(estado as EstadoInscripcion)) {
    throw new ErrorAcademia('Estado inválido.');
  }
  const fila = await inscripcionDe(academyId, id);
  await db
    .update(academyInscripciones)
    .set({ estado: estado as EstadoInscripcion })
    .where(eq(academyInscripciones.id, id));
  return `${fila.email} → ${String(estado)}`;
}

export async function eliminarInscripcion(academyId: number, id: number) {
  const fila = await inscripcionDe(academyId, id);
  await db.delete(academyInscripciones).where(eq(academyInscripciones.id, id));
  return fila.email;
}
