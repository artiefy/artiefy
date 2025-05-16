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

export async function updateUserSubscription(
	paymentData: PaymentData
): Promise<void> {
	const { email_buyer, state_pol, reference_sale } = paymentData;
	console.log('📩 Recibido pago de:', email_buyer, 'con estado:', state_pol);

	if (state_pol !== '4') {
		console.warn(
			`⚠️ Pago con estado ${state_pol}, no se actualizó la suscripción.`
		);
		return;
	}

	// Extraer el tipo de plan de manera más robusta y convertir a formato correcto
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
			// Actualizar usuario existente con el nuevo plan
			await db
				.update(users)
				.set({
					subscriptionStatus: 'active',
					subscriptionEndDate: new Date(subscriptionEndBogota), // Guardamos en formato Bogotá
					planType: planType, // Asegurarse que planType se actualice
					purchaseDate: new Date(bogotaNow), // Guardamos en formato Bogotá
					updatedAt: new Date(),
				})
				.where(eq(users.email, email_buyer));

			console.log('✅ Usuario actualizado con nuevo plan:', {
				email: email_buyer,
				newPlan: planType,
			});
		}

		// Actualizar Clerk - Corregido el manejo de tipos
		const clerk = await clerkClient(); // Await the function to get the client
		const clerkUsers = await clerk.users.getUserList({
			emailAddress: [email_buyer],
		});

		const clerkUser = clerkUsers.data?.[0];

		if (clerkUser) {
			// Obtener metadata actual de manera segura
			const currentMetadata = await clerk.users.getUser(clerkUser.id);

			// Actualizar metadata de manera segura
			await clerk.users.updateUserMetadata(clerkUser.id, {
				publicMetadata: {
					...currentMetadata.publicMetadata,
					subscriptionStatus: 'active',
					subscriptionEndDate: subscriptionEndBogota,
					planType: planType,
				},
			});

			console.log('✅ Clerk metadata actualizado:', {
				email: email_buyer,
				plan: planType,
				status: 'active',
				endDate: subscriptionEndBogota,
			});
		} else {
			console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
			return;
		}

		// Logs de depuración
		console.log(`📅 Inicio suscripción (Bogotá): ${bogotaNow}`);
		console.log(`📅 Fin suscripción (Bogotá): ${subscriptionEndBogota}`);
		console.log(
			`🌍 Fin suscripción (UTC): ${subscriptionEndUtc.toISOString()}`
		);
	} catch (error) {
		if (error instanceof Error) {
			console.error('❌ Error:', error.message);
			throw new Error(error.message);
		} else {
			console.error('❌ Unknown error:', error);
			throw new Error('Unknown error occurred');
		}
	}
}
