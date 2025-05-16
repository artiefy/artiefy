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
	// Desestructuración directa para mayor claridad
	const { email_buyer, state_pol, reference_sale } = paymentData;
	console.log('📩 Recibido pago de:', email_buyer, 'con estado:', state_pol);

	if (state_pol !== '4') {
		console.warn(
			`⚠️ Pago con estado ${state_pol}, no se actualizó la suscripción.`
		);
		return;
	}

	// Mejorada la detección del tipo de plan
	const getPlanTypeFromReference = (
		ref: string
	): 'Pro' | 'Premium' | 'Enterprise' => {
		console.log('🔍 Analyzing raw reference:', ref);

		const normalizedRef = ref.toLowerCase();
		const matches = {
			premium: normalizedRef.includes('plan_premium_'),
			enterprise: normalizedRef.includes('plan_enterprise_'),
			pro: normalizedRef.includes('plan_pro_'),
		};

		console.log('🔍 Reference matches:', matches);

		if (matches.premium) return 'Premium';
		if (matches.enterprise) return 'Enterprise';
		return 'Pro';
	};

	const planType = getPlanTypeFromReference(reference_sale);

	console.log('🔄 Plan detection:', {
		reference: reference_sale,
		detectedPlan: planType,
		includes_premium: reference_sale.toLowerCase().includes('premium'),
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
			console.log('👤 Updating user plan:', {
				from: existingUser.planType,
				to: planType,
			});

			const updateResult = await db
				.update(users)
				.set({
					planType,
					subscriptionStatus: 'active',
					subscriptionEndDate: new Date(subscriptionEndBogota),
					purchaseDate: new Date(bogotaNow),
					updatedAt: new Date(),
				})
				.where(eq(users.email, email_buyer))
				.returning();

			console.log('✅ Database update completed:', updateResult);

			// Actualización de Clerk con verificación explícita
			const clerk = await clerkClient();
			const clerkUsers = await clerk.users.getUserList({
				emailAddress: [email_buyer],
			});

			if (clerkUsers.data.length > 0) {
				const clerkUser = clerkUsers.data[0];

				console.log('🔄 Current Clerk metadata:', clerkUser.publicMetadata);

				const updatedMetadata = await clerk.users.updateUserMetadata(
					clerkUser.id,
					{
						publicMetadata: {
							planType, // Asegurar que se actualice explícitamente
							subscriptionStatus: 'active',
							subscriptionEndDate: subscriptionEndBogota,
						},
					}
				);

				console.log('✅ New Clerk metadata:', updatedMetadata.publicMetadata);
			}
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
