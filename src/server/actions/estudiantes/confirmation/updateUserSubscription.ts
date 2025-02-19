import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { sendNotification } from '~/utils/notifications';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

interface PaymentData {
  email_buyer: string;
  state_pol: string;
}

export async function updateUserSubscription(paymentData: PaymentData) {
  const { email_buyer, state_pol } = paymentData;

  console.log('Payment Data:', paymentData); // Log the payment data

  if (state_pol === '4') { // Estado aprobado
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    // Actualizar la suscripción en la base de datos
    const updateResult = await db.update(users)
      .set({
        subscriptionStatus: 'active',
        subscriptionEndDate: subscriptionEndDate,
      })
      .where(eq(users.email, email_buyer));

    console.log('Database Update Result:', updateResult); // Log the result of the database update

    // Obtener el usuario de Clerk y actualizar la suscripción
    const { userId } = await auth();
    console.log('User ID from auth:', userId); // Log the user ID from auth
    if (userId) {
      const client = await clerkClient();
      const clerkUpdateResult = await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          subscriptionStatus: 'active',
          subscriptionEndDate: subscriptionEndDate.toISOString(),
        },
      });
      console.log('Clerk Update Result:', clerkUpdateResult); // Log the result of the Clerk update
    }

    // Notificar al usuario 3 días antes de que expire la suscripción
    setTimeout(async () => {
      await sendNotification(email_buyer, 'Tu suscripción está a punto de expirar');
      console.log('Notification sent to:', email_buyer); // Log the notification
    }, (30 - 3) * 24 * 60 * 60 * 1000); // 27 días en milisegundos
  }
}//6 3 el dia de pago
