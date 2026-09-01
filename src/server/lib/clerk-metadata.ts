import { clerkClient } from '@clerk/nextjs/server';

import 'server-only';

/**
 * Actualiza los metadatos públicos de Clerk SIN perder los que ya había.
 *
 * `updateUserMetadata` reemplaza el objeto completo, no lo fusiona. Escribir
 * solo `{planType, subscriptionStatus, subscriptionEndDate}` borraba el
 * campo `role`, y el usuario acababa degradado a estudiante en su siguiente
 * visita (la ruta de rol por defecto rellenaba el hueco).
 *
 * Usar siempre esta función en vez de llamar a `updateUserMetadata` directo.
 */
export async function fusionarMetadatosPublicos(
  userId: string,
  cambios: Record<string, unknown>
): Promise<void> {
  const clerk = await clerkClient();
  const usuario = await clerk.users.getUser(userId);

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...(usuario.publicMetadata ?? {}),
      ...cambios,
    },
  });
}
