import { auth } from '@clerk/nextjs/server';

import 'server-only';

/**
 * ¿De qué educador son los datos que se van a devolver?
 *
 * Las rutas del panel de educadores reciben el `userId` por query string. Sin
 * comprobar nada, eso permitía leer el panel de cualquier educador — incluso
 * sin sesión. Aquí se decide:
 *
 *   - Sin sesión: se rechaza.
 *   - Educador: solo sus propios datos, se ignore lo que pida la URL.
 *   - super-admin y admin: pueden pedir los de otro. Es lo que permite "ver
 *     el panel como lo ve un educador".
 */
export type EducadorSolicitado =
  | { ok: true; userId: string; suplantando: boolean }
  | { ok: false; status: number; error: string };

export async function resolverEducadorSolicitado(
  pedido: string | null
): Promise<EducadorSolicitado> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { ok: false, status: 401, error: 'No autorizado' };
  }

  const role = String(sessionClaims?.metadata?.role ?? '');
  const puedeVerDeOtros = role === 'super-admin' || role === 'admin';

  if (!pedido || pedido === userId) {
    return { ok: true, userId, suplantando: false };
  }

  if (puedeVerDeOtros) {
    return { ok: true, userId: pedido, suplantando: true };
  }

  return {
    ok: false,
    status: 403,
    error: 'No puedes ver el panel de otro educador',
  };
}
