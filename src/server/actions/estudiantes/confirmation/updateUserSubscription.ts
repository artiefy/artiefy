import { clerkClient, type User } from '@clerk/nextjs/server'; // ✅ Importar Clerk
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
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
    // 🔍 Buscar usuario en la base de datos
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email_buyer),
    });

    let userId = existingUser?.id;

    if (!existingUser) {
      // 🆕 Si el usuario no existe, crearlo con un ID único
      userId = uuidv4();
      await db.insert(users).values({
        id: userId,
        email: email_buyer,
        role: 'student',
        subscriptionStatus: 'active',
        subscriptionEndDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Usuario creado en la base de datos: ${email_buyer}`);
    } else {
      // 🔄 Si el usuario ya existe, actualizar su estado de suscripción
      await db
        .update(users)
        .set({
          subscriptionStatus: 'active',
          subscriptionEndDate,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email_buyer));

      console.log(`✅ Usuario existente actualizado a activo: ${email_buyer}`);
    }

    // 🔍 Buscar usuario en Clerk y actualizar `publicMetadata`
    const clerkClientInstance = await clerkClient();
    const clerkUsers = await clerkClientInstance.users.getUserList({
      emailAddress: [email_buyer],
    });

    if (clerkUsers.data.length > 0) {
      const clerkUser = clerkUsers.data[0] as User | undefined;
      if (!clerkUser) {
        console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
        return;
      }

      await clerkClientInstance.users.updateUser(clerkUser.id, {
        publicMetadata: {
          subscriptionStatus: 'active',
          subscriptionEndDate: subscriptionEndDate.toISOString(),
        },
      });

      console.log(`✅ Clerk metadata actualizado para ${email_buyer}`);
    } else {
      console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
    }

    // 📢 Notificar al usuario 3 días antes de que expire la suscripción
    setTimeout(
      async () => {
        await sendNotification(
          email_buyer,
          'Tu suscripción está a punto de expirar'
        );
        console.log(`📢 Notificación enviada a: ${email_buyer}`);
      },
      (30 - 3) * 24 * 60 * 60 * 1000
    ); // 27 días en milisegundos
  } catch (error) {
    console.error(`❌ Error en updateUserSubscription:`, error);
  }
}
