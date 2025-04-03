import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export async function checkAndUpdateSubscriptions() {
	const now = new Date();
	console.log('🕒 Iniciando verificación de suscripciones:', now.toISOString());

	try {
		// Obtener todos los usuarios con suscripciones activas
		const activeUsers = await db.query.users.findMany({
			where: eq(users.subscriptionStatus, 'active'),
		});

		console.log(`📊 Total usuarios activos encontrados: ${activeUsers.length}`);

		for (const user of activeUsers) {
			// Asegurarse de que subscriptionEndDate no sea null
			if (!user.subscriptionEndDate) {
				console.warn(`⚠️ Usuario sin fecha de expiración: ${user.email}`);
				continue;
			}

			const endDate = new Date(user.subscriptionEndDate);
			console.log(`\n👤 Verificando usuario: ${user.email}`);
			console.log(`📅 Fecha de expiración: ${endDate.toISOString()}`);
			console.log(`⏰ Fecha actual: ${now.toISOString()}`);

			if (endDate < now) {
				console.log(`⚠️ Suscripción expirada para ${user.email}`);

				// Actualizar en base de datos
				await db
					.update(users)
					.set({
						subscriptionStatus: 'inactive',
						updatedAt: new Date(),
					})
					.where(eq(users.id, user.id));

				console.log('✅ BD actualizada a inactive');

				// Actualizar en Clerk
				const clerk = await clerkClient();
				const clerkUsers = await clerk.users.getUserList({
					emailAddress: [user.email],
				});

				if (clerkUsers.data.length > 0) {
					const clerkUser = clerkUsers.data[0];
					await clerk.users.updateUser(clerkUser.id, {
						publicMetadata: {
							subscriptionStatus: 'inactive',
							subscriptionEndDate: endDate.toISOString(),
						},
					});
					console.log('✅ Clerk actualizado a inactive');
				} else {
					console.warn(`⚠️ Usuario no encontrado en Clerk: ${user.email}`);
				}
			} else {
				console.log(`✅ Suscripción vigente para ${user.email}`);
			}
		}

		return {
			usersChecked: activeUsers.length,
			timestamp: now.toISOString(),
		};
	} catch (error) {
		console.error('❌ Error en checkAndUpdateSubscriptions:', error);
		throw error;
	}
}
