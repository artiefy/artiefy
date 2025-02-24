import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { sendNotification } from '~/utils/notifications';

interface PaymentData {
  email_buyer: string;
  state_pol: string;
}

export async function updateUserSubscription(paymentData: PaymentData) {
  const { email_buyer, state_pol } = paymentData;
  console.log('📩 Recibido pago de:', email_buyer, 'con estado:', state_pol);

  if (state_pol !== '4') {
    console.warn(
      `⚠️ Pago con estado ${state_pol}, no se actualiza suscripción.`
    );
    return;
  }

  // 🗓️ Calcular fecha de expiración (1 mes desde hoy)
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

  try {
    // Obtener el usuario actual desde Clerk
    const user = await currentUser();

    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const userId = user.id;

    // 🔍 Buscar usuario en la base de datos
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      if (!user.fullName || !user.emailAddresses[0]?.emailAddress) {
        throw new Error('Información del usuario incompleta');
      }

      // 🆕 Si el usuario no existe, crearlo con el ID de Clerk
      await db.insert(users).values({
        id: userId,
        email: user.emailAddresses[0].emailAddress,
        role: 'student',
        subscriptionStatus: 'active',
        subscriptionEndDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Usuario creado en la base de datos: ${user.emailAddresses[0].emailAddress}`);
    } else {
      // 🔄 Si el usuario ya existe, actualizar su estado de suscripción
      await db
        .update(users)
        .set({
          subscriptionStatus: 'active',
          subscriptionEndDate,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`✅ Usuario existente actualizado a activo: ${user.emailAddresses[0].emailAddress}`);
    }

    // 🔍 Actualizar `publicMetadata` en Clerk
    const clerkClientInstance = await clerkClient();
    await clerkClientInstance.users.updateUser(userId, {
      publicMetadata: {
        subscriptionStatus: 'active',
        subscriptionEndDate: subscriptionEndDate.toISOString(),
      },
    });

    console.log(`✅ Clerk metadata actualizado para ${user.emailAddresses[0].emailAddress}`);

    // 📢 Notificar al usuario 3 días antes de que expire la suscripción
    setTimeout(
      async () => {
        await sendNotification(
          user.emailAddresses[0].emailAddress,
          'Tu suscripción está a punto de expirar'
        );
        console.log(`📢 Notificación enviada a: ${user.emailAddresses[0].emailAddress}`);
      },
      (30 - 3) * 24 * 60 * 60 * 1000
    ); // 27 días en milisegundos
  } catch (error) {
    console.error(`❌ Error en updateUserSubscription:`, error);
  }
}