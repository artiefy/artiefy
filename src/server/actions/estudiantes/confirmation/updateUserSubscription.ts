import { clerkClient } from '@clerk/nextjs/server';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const SUBSCRIPTION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const TIME_ZONE = 'America/Bogota';

interface PaymentData {
	email_buyer: string;
	state_pol: string;
	reference_sale: string;
}

export async function updateUserSubscription(paymentData: PaymentData) {
	const { email_buyer, state_pol } = paymentData;
	console.log('📩 Recibido pago de:', email_buyer, 'con estado:', state_pol);

	if (state_pol !== '4') {
		console.warn(
			`⚠️ Pago con estado ${state_pol}, no se actualizó la suscripción.`
		);
		return;
	}

	// Mejorar la detección del tipo de plan
	const planType = paymentData.reference_sale
		.toLowerCase()
		.includes('plan_premium_')
		? 'Premium'
		: paymentData.reference_sale.toLowerCase().includes('plan_enterprise_')
			? 'Enterprise'
			: 'Pro';

	console.log('🔄 Analyzing reference_sale:', {
		reference: paymentData.reference_sale,
		detectedPlan: planType,
	});

	// Obtener la fecha actual en Bogotá y calcular el fin de suscripción
	const now = new Date();
	const bogotaNow = formatInTimeZone(now, TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');

	const subscriptionEndDate = new Date(now.getTime() + SUBSCRIPTION_DURATION);
	const subscriptionEndBogota = formatInTimeZone(
		subscriptionEndDate,
		TIME_ZONE,
		'yyyy-MM-dd HH:mm:ss'
	);

	// Convertir a UTC antes de guardar en la base de datos
	const subscriptionEndUtc = toZonedTime(subscriptionEndDate, TIME_ZONE);

	try {
		// Buscar usuario existente
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email_buyer),
		});

		console.log('Current plan info:', {
			existingPlan: existingUser?.planType,
			newPlan: planType,
		});

		if (existingUser) {
			// Actualizar explícitamente el planType con una consulta directa
			const updateResult = await db
				.update(users)
				.set({
					planType, // Asegurarse que sea exactamente 'Pro', 'Premium' o 'Enterprise'
					subscriptionStatus: 'active',
					subscriptionEndDate: new Date(subscriptionEndBogota),
					purchaseDate: new Date(bogotaNow),
					updatedAt: new Date(),
				})
				.where(eq(users.email, email_buyer))
				.returning({ updatedPlanType: users.planType });

			console.log('✅ Database update result:', updateResult);
		}

		// Actualizar Clerk con una actualización completa
		// If clerkClient is a function, do this:
		const clerk = await clerkClient();
		const clerkUsers = await clerk.users.getUserList({
			emailAddress: [email_buyer],
		});

		if (clerkUsers.data.length > 0) {
			const clerkUser = clerkUsers.data[0];

			// Forzar la actualización completa de los metadatos
			const updatedMetadata = await clerk.users.updateUserMetadata(
				clerkUser.id,
				{
					publicMetadata: {
						planType, // Asegurarse que sea exactamente 'Pro', 'Premium' o 'Enterprise'
						subscriptionStatus: 'active',
						subscriptionEndDate: subscriptionEndBogota,
					},
				}
			);

			console.log('✅ Clerk metadata update result:', {
				oldPlan: clerkUser.publicMetadata?.planType,
				newPlan: planType,
				updatedMetadata,
			});
		}

		// Logs de depuración
		console.log(`📅 Inicio suscripción (Bogotá): ${bogotaNow}`);
		console.log(`📅 Fin suscripción (Bogotá): ${subscriptionEndBogota}`);
		console.log(
			`🌍 Fin suscripción (UTC): ${subscriptionEndUtc.toISOString()}`
		);
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		console.error('❌ Error:', errorMessage);
		throw new Error(errorMessage);
	}
}
