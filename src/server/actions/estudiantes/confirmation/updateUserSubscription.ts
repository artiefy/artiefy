import { clerkClient, type User } from '@clerk/nextjs/server';
import { formatInTimeZone } from 'date-fns-tz';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { fusionarMetadatosPublicos } from '~/server/lib/clerk-metadata';
import { getPlanTierFromReference } from '~/server/payments/productPricing';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const SUBSCRIPTION_DURATION = 30 * DAY_IN_MS; // 30 días en milisegundos
// Días de regalo para la primera compra del plan Premium (cuenta nueva).
const PREMIUM_FIRST_PURCHASE_BONUS_DAYS = 10;
const TIME_ZONE = 'America/Bogota';

interface PaymentData {
  email_buyer: string;
  state_pol: string;
  reference_sale: string;
  value?: string;
}

export async function updateUserSubscription(paymentData: PaymentData) {
  const { email_buyer, state_pol, reference_sale } = paymentData;
  if (state_pol !== '4') {
    console.warn(
      `⚠️ Pago con estado ${state_pol}, no se actualizó la suscripción.`
    );
    return;
  }

  // Same tier rule the confirmation webhook uses to check the paid price.
  const planType = getPlanTierFromReference(reference_sale);

  // Obtener la fecha actual en Bogotá
  const now = new Date();
  const bogotaNow = formatInTimeZone(now, TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');

  try {
    // Buscar el usuario en Clerk primero para obtener su ID real
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({
      emailAddress: [email_buyer],
    });

    if (clerkUsers.totalCount === 0) {
      console.warn('⚠️ Plan payment for an email with no Clerk account');
      return;
    }

    const clerkUser = clerkUsers.data[0] as User;
    const clerkUserId = clerkUser.id;

    // Buscar usuario en la base de datos por email Y rol estudiante
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.email, email_buyer), eq(users.role, 'estudiante')),
    });

    // Primera compra: el usuario aún no tiene ninguna compra registrada.
    // Solo en ese caso el plan Premium suma los días de regalo.
    const isFirstPurchase = !existingUser?.purchaseDate;
    const bonusDays =
      planType === 'Premium' && isFirstPurchase
        ? PREMIUM_FIRST_PURCHASE_BONUS_DAYS
        : 0;
    const subscriptionEndDate = new Date(
      now.getTime() + SUBSCRIPTION_DURATION + bonusDays * DAY_IN_MS
    );
    const subscriptionEndBogota = formatInTimeZone(
      subscriptionEndDate,
      TIME_ZONE,
      'yyyy-MM-dd HH:mm:ss'
    );

    if (!existingUser) {
      // Crear nuevo usuario con el ID de Clerk
      await db.insert(users).values({
        id: clerkUserId,
        name: clerkUser.fullName ?? 'Usuario',
        email: email_buyer,
        role: 'estudiante',
        subscriptionStatus: 'active',
        subscriptionEndDate: subscriptionEndDate,
        planType: planType,
        purchaseDate: now,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Student created with an active plan: ${clerkUserId}`);
    } else {
      // Actualizar usuario existente (estudiante)
      await db
        .update(users)
        .set({
          subscriptionStatus: 'active',
          subscriptionEndDate: subscriptionEndDate,
          planType: planType,
          purchaseDate: now,
          updatedAt: new Date(),
        })
        .where(and(eq(users.email, email_buyer), eq(users.role, 'estudiante')));
      console.log(`✅ Student plan activated: ${clerkUserId}`);
    }

    // Actualizar metadata en Clerk
    // Fusiona en vez de reemplazar: un educador que renovaba su suscripción
    // perdía el rol y acababa convertido en estudiante.
    await fusionarMetadatosPublicos(clerkUser.id, {
      subscriptionStatus: 'active',
      subscriptionEndDate: subscriptionEndDate.toISOString(),
      planType: planType,
      // A paid plan ends the signup trial; without this the merge kept
      // `isTrial: true` and the buyer stayed on trial limits.
      isTrial: false,
    });

    console.log(
      `📅 Plan ${planType} (${clerkUserId}): ${bogotaNow} → ${subscriptionEndBogota}, bonus days ${bonusDays}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', errorMessage);
    throw new Error(errorMessage);
  }
}
