import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { sendNotification } from '~/utils/notifications';
import { v4 as uuidv4 } from 'uuid';
import { clerkClient } from '@clerk/nextjs/server'; // ✅ Importar Clerk

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

		let userId = existingUser?.id;

		if (!existingUser) {
			// 🆕 Si no existe en la base de datos, crear usuario con un `id` único
			userId = uuidv4();
			await db.insert(users).values({
				id: userId,
				email: email_buyer,
				role: 'student',
				subscriptionStatus: 'active',
				subscriptionEndDate: subscriptionEndDate,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			console.log(`✅ Usuario creado: ${email_buyer}`);
		} else {
			// 🔄 Si ya existe y está inactivo, activarlo
			await db.update(users)
				.set({
					subscriptionStatus: 'active',
					subscriptionEndDate: subscriptionEndDate,
					updatedAt: new Date(),
				})
				.where(eq(users.email, email_buyer));

			console.log(`✅ Usuario actualizado a activo: ${email_buyer}`);
		}

		// 🔍 Buscar el usuario en Clerk y actualizar `publicMetadata`
		try {
			const clerk = await clerkClient();
			const clerkUsers = await clerk.users.getUserList({
				emailAddress: [email_buyer],
			});

			const clerkUser = clerkUsers.data.length > 0 ? clerkUsers.data[0] : null;

			if (clerkUser) {
				await clerk.users.updateUser(clerkUser.id, {
					publicMetadata: {
						subscriptionStatus: 'active',
						subscriptionEndDate: subscriptionEndDate.toISOString(),
					},
				});
				console.log(`✅ Clerk metadata actualizado para ${email_buyer}`);
			} else {
				console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
			}
		} catch (error) {
			console.error(`❌ Error actualizando Clerk metadata:`, error);
		}

		// 📢 Notificar al usuario 3 días antes de que expire la suscripción
		setTimeout(async () => {
			await sendNotification(email_buyer, 'Tu suscripción está a punto de expirar');
			console.log(`📢 Notificación enviada a: ${email_buyer}`);
		}, (30 - 3) * 24 * 60 * 60 * 1000); // 27 días en milisegundos
	}
}
