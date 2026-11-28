import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  academyActivities,
  academyClases,
  academyCourseInstructors,
  academyCourses,
  academyLessons,
  type AcademyRole,
} from '~/server/db/schema';

import { type Academia, academiaPorSlug, ErrorAcademia } from './academias';
import { membresiaConArtiefy, type UsuarioAcademia } from './usuarios';

import 'server-only';

/** Super-admin de Artiefy: administra todas las academias. */
export async function esSuperAdminArtiefy(): Promise<string | null> {
  const { userId, sessionClaims } = await auth();
  return userId && sessionClaims?.metadata?.role === 'super-admin'
    ? userId
    : null;
}

/**
 * Cuenta de la sesión dentro de la academia del slug, exigiendo uno de los
 * roles. Lanza ErrorAcademia (401/403/404) si no corresponde.
 */
export async function cuentaDeAcademia(
  slug: string,
  roles: readonly AcademyRole[]
): Promise<{ academia: Academia; cuenta: UsuarioAcademia }> {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new ErrorAcademia('No autorizado', 401);
  const academia = await academiaPorSlug(slug);
  if (!academia) throw new ErrorAcademia('Academia no encontrada', 404);
  const cuenta = await membresiaConArtiefy(
    academia,
    userId,
    sessionClaims?.metadata
  );
  if (!cuenta || !roles.includes(cuenta.role)) {
    throw new ErrorAcademia('No autorizado', 403);
  }
  if (!cuenta.activo) {
    throw new ErrorAcademia(
      'Tu cuenta en esta academia está desactivada.',
      403
    );
  }
  return { academia, cuenta };
}

// Postgres 42P01 (undefined_table) o 42703 (undefined_column): la tabla o
// columna de la sección aún no existe porque no se ha ejecutado su script de
// scripts/academy_*.sql.
const SQL_PENDIENTE = ['42P01', '42703'];
const esTablaFaltante = (error: unknown) =>
  SQL_PENDIENTE.includes(
    String((error as { cause?: { code?: string } })?.cause?.code)
  ) || SQL_PENDIENTE.includes(String((error as { code?: string })?.code));

/** Convierte un error en respuesta JSON (mensaje visible si es de negocio). */
export function respuestaDeError(error: unknown, contexto: string) {
  if (esTablaFaltante(error)) {
    return NextResponse.json(
      {
        error:
          'Esta sección aún no está habilitada: falta ejecutar su script SQL.',
        sqlPendiente: true,
      },
      { status: 503 }
    );
  }
  if (error instanceof ErrorAcademia) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  console.error(`[ACADEMIAS] ${contexto}:`, error);
  return NextResponse.json(
    { error: 'Ocurrió un error inesperado' },
    { status: 500 }
  );
}

// ------------------------------------------------- Acceso por curso ---

type Recurso =
  | { curso: number }
  | { leccion: number }
  | { actividad: number }
  | { sesion: number };

/** Curso al que pertenece una clase, actividad o sesión de la academia. */
async function cursoDelRecurso(
  academyId: number,
  recurso: Recurso
): Promise<number> {
  let courseId: number | undefined;
  if ('curso' in recurso) courseId = recurso.curso;
  else if ('leccion' in recurso) {
    const [f] = await db
      .select({ c: academyLessons.courseId })
      .from(academyLessons)
      .where(
        and(
          eq(academyLessons.id, recurso.leccion),
          eq(academyLessons.academyId, academyId)
        )
      )
      .limit(1);
    courseId = f?.c;
  } else if ('actividad' in recurso) {
    const [f] = await db
      .select({ c: academyLessons.courseId })
      .from(academyActivities)
      .innerJoin(
        academyLessons,
        eq(academyLessons.id, academyActivities.lessonId)
      )
      .where(
        and(
          eq(academyActivities.id, recurso.actividad),
          eq(academyActivities.academyId, academyId)
        )
      )
      .limit(1);
    courseId = f?.c;
  } else {
    const [f] = await db
      .select({ c: academyClases.courseId })
      .from(academyClases)
      .where(
        and(
          eq(academyClases.id, recurso.sesion),
          eq(academyClases.academyId, academyId)
        )
      )
      .limit(1);
    courseId = f?.c;
  }
  if (!courseId || !Number.isInteger(courseId)) {
    throw new ErrorAcademia('No encontrado', 404);
  }
  return courseId;
}

/**
 * Como en Artiefy: el super-admin gestiona cualquier curso de la academia y
 * el educador solo los suyos (instructor principal o adicional). Recibe el
 * curso o una clase / actividad / sesión de él.
 */
export async function cuentaDelCurso(slug: string, recurso: Recurso) {
  const s = await cuentaDeAcademia(slug, ['super-admin', 'educador']);
  const courseId = await cursoDelRecurso(s.academia.id, recurso);
  if (s.cuenta.role === 'educador') {
    const [principal] = await db
      .select({ id: academyCourses.id })
      .from(academyCourses)
      .where(
        and(
          eq(academyCourses.id, courseId),
          eq(academyCourses.academyId, s.academia.id),
          eq(academyCourses.instructor, s.cuenta.userId)
        )
      )
      .limit(1);
    const [adicional] = principal
      ? [principal]
      : await db
          .select({ id: academyCourseInstructors.id })
          .from(academyCourseInstructors)
          .where(
            and(
              eq(academyCourseInstructors.courseId, courseId),
              eq(academyCourseInstructors.userId, s.cuenta.userId)
            )
          )
          .limit(1)
          .catch(() => []);
    if (!adicional) throw new ErrorAcademia('No autorizado', 403);
  }
  return { ...s, courseId };
}
