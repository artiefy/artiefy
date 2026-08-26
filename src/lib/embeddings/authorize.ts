/**
 * Autorización para generar embeddings de un curso.
 *
 * Generar embeddings cuesta dinero (llamadas a OpenAI), así que la ruta no
 * puede quedar abierta. Las reglas:
 *
 *   - super-admin y admin: cualquier curso.
 *   - educador: solo los cursos que le pertenecen (como instructor titular
 *     o co-instructor).
 *   - cualquier otro: denegado.
 */

import { auth } from '@clerk/nextjs/server';

import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';

export type AuthResult =
  | { ok: true; userId: string; role: string }
  | { ok: false; status: number; error: string };

export async function authorizeCourseEmbeddings(
  courseId: number
): Promise<AuthResult> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { ok: false, status: 401, error: 'No autorizado' };
  }

  const role = String(sessionClaims?.metadata?.role ?? '');

  if (role === 'super-admin' || role === 'admin') {
    return { ok: true, userId, role };
  }

  if (role === 'educador') {
    const esSuyo = await isCourseOwnedByEducator(courseId, userId);
    if (esSuyo) {
      return { ok: true, userId, role };
    }
    return {
      ok: false,
      status: 403,
      error: 'Solo puedes indexar los cursos que tienes asignados',
    };
  }

  return { ok: false, status: 403, error: 'No tienes permiso para indexar' };
}
