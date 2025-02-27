import { clerkClient, type User } from '@clerk/nextjs/server';
import { formatInTimeZone } from 'date-fns-tz';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
// import { scheduleSubscriptionNotifications, sendExpirationNotifications } from '~/utils/email/notifications';

// Definir constantes de tiempo
const SUBSCRIPTION_DURATION = 5 * 60 * 1000; // 5 minutos

interface PaymentData {
  email_buyer: string;
  state_pol: string;
  reference_sale: string; // Añadir para extraer el tipo de plan
}

export async function updateUserSubscription(paymentData: PaymentData) {
  const { email_buyer, state_pol, reference_sale } = paymentData;
  console.log('📩 Recibido pago de:', email_buyer, 'con estado:', state_pol);

  if (state_pol !== '4') {
    console.warn(
      `⚠️ Pago con estado ${state_pol}, no se actualizo la suscripción.`
    );
    return;
  }

  // Extraer el tipo de plan del reference_sale o pasarlo como parámetro adicional
  const planType = reference_sale.includes('pro')
    ? 'Pro'
    : reference_sale.includes('premium')
      ? 'Premium'
      : reference_sale.includes('enterprise')
        ? 'Enterprise'
        : 'Pro'; // Default

  // 🗓️ Calcular fecha de expiración en zona horaria de Bogotá
  const bogotaDate = new Date(
    formatInTimeZone(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm:ss')
  );
  const subscriptionEndDate = new Date(
    bogotaDate.getTime() + SUBSCRIPTION_DURATION
  );
  const purchaseDate = formatInTimeZone(new Date(), 'America/Bogota', 'yyyy-MM-dd HH:mm:ss');

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
        subscriptionEndDate: subscriptionEndDate,
        planType: planType,
        purchaseDate: new Date(purchaseDate),
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
          subscriptionEndDate: subscriptionEndDate,
          planType: planType,
          purchaseDate: new Date(purchaseDate),
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

      // Para Clerk, sí necesitamos la fecha en formato ISO string
      await clerkClientInstance.users.updateUser(clerkUser.id, {
        publicMetadata: {
          subscriptionStatus: 'active',
          subscriptionEndDate: subscriptionEndDate.toISOString(),
          planType: planType,
          purchaseDate: purchaseDate,
        },
      });

      console.log(`✅ Clerk metadata actualizado para ${email_buyer}`);
    } else {
      console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
    }

    // Desactivar notificaciones por ahora
    // try {
    // 	await scheduleSubscriptionNotifications(email_buyer, subscriptionEndDate);
    // 	console.log(`✅ Notificaciones programadas para ${email_buyer}`);
    // } catch (error) {
    // 	const errorMessage =
    // 		error instanceof Error ? error.message : 'Unknown error';
    // 	console.error('❌ Error programando notificaciones:', errorMessage);
    // }

    // Enviar notificaciones de expiración a los usuarios
    // await sendExpirationNotifications();

    console.log(
      `📅 Inicio suscripción (Bogotá): ${formatInTimeZone(
        bogotaDate,
        'America/Bogota',
        'yyyy-MM-dd HH:mm:ss'
      )}`
    );
    console.log(
      `📅 Fin suscripción (Bogotá): ${formatInTimeZone(subscriptionEndDate, 'America/Bogota', 'yyyy-MM-dd HH:mm:ss')}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', errorMessage);
    throw new Error(errorMessage);
  }
}