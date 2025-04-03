import { clerkClient } from '@clerk/nextjs/server';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const TIMEZONE = 'America/Bogota';

export async function checkAndUpdateSubscriptions() {
	const nowUTC = new Date();
	const nowBogota = toDate(nowUTC, { timeZone: TIMEZONE });

	console.log('🕒 Verificación iniciada:', {
		utc: nowUTC.toISOString(),
		bogota: formatInTimeZone(nowBogota, TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'),
	});

	try {
		const activeUsers = await db.query.users.findMany({
			where: eq(users.subscriptionStatus, 'active'),
		});

		console.log(`📊 Total usuarios activos: ${activeUsers.length}`);

		for (const user of activeUsers) {
			if (!user.subscriptionEndDate) {
				console.warn(`⚠️ Usuario sin fecha de expiración: ${user.email}`);
				continue;
			}

			const endDate = toDate(user.subscriptionEndDate, { timeZone: TIMEZONE });
			const endDateBogota = formatInTimeZone(
				endDate,
				TIMEZONE,
				'yyyy-MM-dd HH:mm:ss zzz'
			);

			console.log({
				email: user.email,
				endDate: endDateBogota,
				currentTime: formatInTimeZone(
					nowBogota,
					TIMEZONE,
					'yyyy-MM-dd HH:mm:ss zzz'
				),
				hasExpired: endDate < nowBogota,
				timeDiffMinutes:
					(endDate.getTime() - nowBogota.getTime()) / (1000 * 60),
			});

			// Si la fecha de expiración es anterior a la fecha actual
			if (endDate < nowBogota) {
				console.log(`⚠️ Suscripción expirada para ${user.email}`);

				await Promise.all([
					// Actualizar DB
					db
						.update(users)
						.set({
							subscriptionStatus: 'inactive',
							updatedAt: new Date(),
						})
						.where(eq(users.id, user.id)),

					// Actualizar Clerk
					(async () => {
						const clerk = await clerkClient();
						const clerkUsers = await clerk.users.getUserList({
							emailAddress: [user.email],
						});

						if (clerkUsers.data.length > 0) {
							await clerk.users.updateUser(clerkUsers.data[0].id, {
								publicMetadata: {
									subscriptionStatus: 'inactive',
									subscriptionEndDate: endDate.toISOString(),
									planType: user.planType,
								},
							});
							console.log('✅ Clerk actualizado a inactive');
						}
					})(),
				]);

				console.log('✅ Usuario actualizado a inactive:', user.email);
			} else {
				console.log(
					`✅ Suscripción vigente para ${user.email} hasta ${endDateBogota}`
				);
			}
		}

		return {
			usersChecked: activeUsers.length,
			timestamp: formatInTimeZone(
				nowBogota,
				TIMEZONE,
				'yyyy-MM-dd HH:mm:ss zzz'
			),
		};
	} catch (error) {
		console.error('❌ Error:', error);
		throw error;
	}
}
