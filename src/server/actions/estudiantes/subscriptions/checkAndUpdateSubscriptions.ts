import { clerkClient } from '@clerk/nextjs/server';
import { eq, and, lt } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export async function checkAndUpdateSubscriptions() {
  const now = new Date();

  try {
    // Obtener usuarios con suscripciones activas que hayan expirado
    const usersWithExpiredSubscriptions = await db.query.users.findMany({
      where: and(
        eq(users.subscriptionStatus, 'active'),
        lt(users.subscriptionEndDate, now)
      ),
    });

    for (const user of usersWithExpiredSubscriptions) {
      const userId = user.id;

      // Actualizar el estado de la suscripción en la base de datos
      await db
        .update(users)
        .set({
          subscriptionStatus: 'inactive',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Actualizar el estado de la suscripción en Clerk
      const clerk = await clerkClient();
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          subscriptionStatus: 'inactive',
        },
      });

      console.log(`⚠️ Suscripción expirada para ${user.email}, cambiando a inactive.`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error al verificar y actualizar las suscripciones:', error.message);
    } else {
      console.error('Error desconocido al verificar y actualizar las suscripciones');
    }
  }
}
