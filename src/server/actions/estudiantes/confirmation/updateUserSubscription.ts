import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { sendNotification } from '~/utils/notifications';

interface PaymentData {
	email_buyer: string;
	state_pol: string;
	user_id: string; // Add user_id to the payment data
}

export async function updateUserSubscription(paymentData: PaymentData) {
	const { email_buyer, state_pol, user_id } = paymentData;
	console.log('📩 Recibido pago de:', email_buyer, 'con estado:', state_pol);

	if (state_pol !== '4') {
		console.warn(
			`⚠️ Pago con estado ${state_pol}, no se actualiza suscripción.`
		);
		return;
	}

	// 🗓️ Calcular fecha de expiración (5 minutos desde ahora)
	const subscriptionEndDate = new Date();
	subscriptionEndDate.setMinutes(subscriptionEndDate.getMinutes() + 5);

	try {
		// 🔍 Buscar usuario en la base de datos
		const existingUser = await db.query.users.findFirst({
			where: eq(users.id, user_id),
		});

		if (!existingUser) {
			throw new Error('Usuario no encontrado en la base de datos');
		}

		// 🔄 Si el usuario ya existe, actualizar su estado de suscripción
		await db
			.update(users)
			.set({
				subscriptionStatus: 'active',
				subscriptionEndDate,
				updatedAt: new Date(),
			})
			.where(eq(users.id, user_id));

		console.log(`✅ Usuario existente actualizado a activo: ${email_buyer}`);

		// 📢 Notificar al usuario 3 días antes de que expire la suscripción
		setTimeout(
			async () => {
				await sendNotification(
					email_buyer,
					'Tu suscripción está a punto de expirar'
				);
				console.log(`📢 Notificación enviada a: ${email_buyer}`);
			},
			(5 - 3) * 60 * 1000 // 2 minutos en milisegundos
		);
	} catch (error) {
		console.error(`❌ Error en updateUserSubscription:`, error);
	}
}
