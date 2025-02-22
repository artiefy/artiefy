import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { sendNotification } from '~/utils/notifications';

import { v4 as uuidv4 } from 'uuid'; // ✅ Para generar `id` único

interface PaymentData {
	email_buyer: string;
	state_pol: string;
}

export async function updateUserSubscription(paymentData: PaymentData) {
	const { email_buyer, state_pol } = paymentData;

	console.log('Payment Data:', paymentData);

	if (state_pol === '4') {
		// Estado aprobado -> Activar suscripción
		const subscriptionEndDate = new Date();
		subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

		// 🔍 Buscar usuario en la base de datos
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email_buyer),
		});

		if (!existingUser) {
			// 🆕 Si no existe, crear usuario con `id`, `role` y `email`
			await db.insert(users).values({
				id: uuidv4(), // ✅ Generar ID único
				email: email_buyer,
				role: 'student', // ✅ Asignar rol por defecto
				subscriptionStatus: 'active',
				subscriptionEndDate: subscriptionEndDate,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			console.log(`User created: ${email_buyer}`);
		} else {
			// 🔄 Si ya existe y está inactivo, activarlo
			await db.update(users)
				.set({
					subscriptionStatus: 'active',
					subscriptionEndDate: subscriptionEndDate,
					updatedAt: new Date(),
				})
				.where(eq(users.email, email_buyer));

			console.log(`User updated to active: ${email_buyer}`);
		}

		// 📢 Notificar al usuario 3 días antes de que expire la suscripción
		setTimeout(async () => {
			await sendNotification(email_buyer, 'Tu suscripción está a punto de expirar');
			console.log(`Notification sent to: ${email_buyer}`);
		}, (30 - 3) * 24 * 60 * 60 * 1000); // 27 días en milisegundos
	}
}
