import { clerkClient, type User } from '@clerk/nextjs/server';
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
	const { email_buyer, state_pol, reference_sale } = paymentData;
	console.log('📩 Recibido pago de:', email_buyer, 'con estado:', state_pol);

	if (state_pol !== '4') {
		console.warn(
			`⚠️ Pago con estado ${state_pol}, no se actualizó la suscripción.`
		);
		return;
	}

	// Extraer el tipo de plan de manera más robusta
	const planType = reference_sale.toLowerCase().includes('premium')
		? 'Premium'
		: reference_sale.toLowerCase().includes('enterprise')
			? 'Enterprise'
			: 'Pro';

	console.log('🔄 Updating subscription with plan:', planType);

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
		// Buscar usuario en la base de datos
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email_buyer),
		});

		let userId = existingUser?.id;

		// Actualizar en base de datos
		if (!existingUser) {
			userId = uuidv4();
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
		} else {
			await db
				.update(users)
				.set({
					subscriptionStatus: 'active',
					subscriptionEndDate: new Date(subscriptionEndBogota), // Guardamos en formato Bogotá
					planType: planType, // Asegurarnos de que se actualice el planType
					purchaseDate: new Date(bogotaNow), // Guardamos en formato Bogotá
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

		if (clerkUsers.data.length > 0) {
			const clerkUser = clerkUsers.data[0] as User | undefined;
			if (!clerkUser) {
				console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
				return;
			}

			// Actualizar los metadatos incluyendo explícitamente el planType
			await clerk.users.updateUserMetadata(clerkUser.id, {
				publicMetadata: {
					subscriptionStatus: 'active',
					subscriptionEndDate: subscriptionEndBogota, // Formateamos en Bogotá
					planType: planType, // Asegurarnos de que se actualice el planType
				},
			});

			console.log('✅ Clerk metadata actualizado:', {
				email: email_buyer,
				plan: planType,
				status: 'active',
				endDate: subscriptionEndBogota,
			});
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
