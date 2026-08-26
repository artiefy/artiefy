import { auth, clerkClient } from '@clerk/nextjs/server';

import { esCorreoAutorizado, type ResultadoPermiso } from './course-deletion';

import 'server-only';

/**
 * Verifica del lado del servidor que quien pide borrar sea la cuenta
 * autorizada.
 *
 * Ocultar el botón en la interfaz no protege nada: sin esta comprobación,
 * cualquiera podría llamar al endpoint directamente.
 */
export async function autorizarEliminacionDeCurso(): Promise<ResultadoPermiso> {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false, status: 401, error: 'No autorizado' };
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const correo = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (!esCorreoAutorizado(correo)) {
      return {
        ok: false,
        status: 403,
        error: 'No tienes permiso para eliminar cursos',
      };
    }

    return { ok: true };
  } catch {
    // Ante la duda, se deniega: es una operación irreversible.
    return { ok: false, status: 403, error: 'No se pudo verificar el permiso' };
  }
}
