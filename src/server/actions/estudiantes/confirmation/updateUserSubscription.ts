import { clerkClient, type User } from '@clerk/nextjs/server';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const SUBSCRIPTION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos
const TIME_ZONE = 'America/Bogota';

interface PaymentData {
  email_buyer: string;
  state_pol: string;
  reference_sale: string;
  value?: string;
}

export async function updateUserSubscription(paymentData: PaymentData) {
  const { email_buyer, state_pol, reference_sale } = paymentData;
  console.log('📩 Recibido pago de:', email_buyer, 'con estado:', state_pol);

  if (state_pol !== '4') {
    console.warn(
      `⚠️ Pago con estado ${state_pol}, no se actualizó la suscripción.`
    );
    return;
  }

  // Extraer el tipo de plan del reference_sale
  const planType = reference_sale.includes('pro')
    ? 'Pro'
    : reference_sale.includes('premium')
      ? 'Premium'
      : reference_sale.includes('enterprise')
        ? 'Enterprise'
        : 'Pro';

  // Obtener la fecha actual en Bogotá y calcular el fin de suscripción
  const now = new Date();
  const bogotaNow = formatInTimeZone(now, TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
  const subscriptionEndDate = new Date(now.getTime() + SUBSCRIPTION_DURATION);
  const subscriptionEndBogota = formatInTimeZone(
    subscriptionEndDate,
    TIME_ZONE,
    'yyyy-MM-dd HH:mm:ss'
  );
  const subscriptionEndUtc = toZonedTime(subscriptionEndDate, TIME_ZONE);

  try {
    // Buscar usuario en la base de datos
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email_buyer),
    });

    let userId = existingUser?.id;

    if (!existingUser) {
      userId = uuidv4();
      await db.insert(users).values({
        id: userId,
        email: email_buyer,
        role: 'estudiante',
        subscriptionStatus: 'active',
        subscriptionEndDate: new Date(subscriptionEndBogota),
        planType: planType,
        purchaseDate: new Date(bogotaNow),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Usuario creado en la base de datos: ${email_buyer}`);
    } else {
      await db
        .update(users)
        .set({
          subscriptionStatus: 'active',
          subscriptionEndDate: new Date(subscriptionEndBogota),
          planType: planType,
          purchaseDate: new Date(bogotaNow),
          updatedAt: new Date(),
        })
        .where(eq(users.email, email_buyer));
      console.log(`✅ Usuario existente actualizado a activo: ${email_buyer}`);
    }

    // Actualizar metadata en Clerk
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({
      emailAddress: [email_buyer],
    });

    if (clerkUsers.totalCount > 0) {
      const clerkUser = clerkUsers.data[0] as User | undefined;
      if (!clerkUser) {
        console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
        return;
      }

      await clerk.users.updateUserMetadata(clerkUser.id, {
        publicMetadata: {
          subscriptionStatus: 'active',
          subscriptionEndDate: subscriptionEndBogota,
          planType: planType,
        },
      });

      console.log(`✅ Clerk metadata actualizado para ${email_buyer}`);
    } else {
      console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
    }

    // Logs de depuración
    console.log(`📅 Inicio suscripción (Bogotá): ${bogotaNow}`);
    console.log(`📅 Fin suscripción (Bogotá): ${subscriptionEndBogota}`);
    console.log(
      `🌍 Fin suscripción (UTC): ${subscriptionEndUtc.toISOString()}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', errorMessage);
    throw new Error(errorMessage);
  }
}
