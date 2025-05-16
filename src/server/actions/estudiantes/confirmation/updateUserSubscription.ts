import { clerkClient } from '@clerk/nextjs/server';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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

		if (existingUser) {
			// Actualizar explícitamente el planType
			await db
				.update(users)
				.set({
					planType: planType, // Asegurarse que esto se actualice
					subscriptionStatus: 'active',
					subscriptionEndDate: new Date(subscriptionEndBogota),
					purchaseDate: new Date(bogotaNow),
					updatedAt: new Date(),
				})
				.where(eq(users.email, email_buyer));

			console.log('✅ Database updated with new plan:', {
				email: email_buyer,
				newPlan: planType,
				previousPlan: existingUser.planType,
			});
		} else {
			const userId = uuidv4();
			await db.insert(users).values({
				id: userId,
				email: email_buyer,
				role: 'estudiante',
				subscriptionStatus: 'active',
				subscriptionEndDate: new Date(subscriptionEndBogota), // Guardamos en formato Bogotá
				planType: planType,
				purchaseDate: new Date(bogotaNow), // Guardamos en formato Bogotá
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			console.log(`✅ Usuario creado en la base de datos: ${email_buyer}`);
		}

		// Actualizar metadata en Clerk
		const clerk = await clerkClient(); // Await the function to get the client
		const clerkUsers = await clerk.users.getUserList({
			emailAddress: [email_buyer],
		});

		// Actualizar metadata de Clerk
		if (clerkUsers.data.length > 0) {
			const clerkUser = clerkUsers.data[0];

			// Obtener metadata actual para logging
			const currentMetadata = await clerk.users.getUser(clerkUser.id);

			await clerk.users.updateUserMetadata(clerkUser.id, {
				publicMetadata: {
					...currentMetadata.publicMetadata,
					subscriptionStatus: 'active',
					subscriptionEndDate: subscriptionEndBogota,
					planType: planType, // Asegurarse que esto se actualice
				},
			});

			console.log('✅ Clerk metadata updated:', {
				previous: currentMetadata.publicMetadata.planType,
				new: planType,
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
