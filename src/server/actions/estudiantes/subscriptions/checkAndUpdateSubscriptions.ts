import { clerkClient } from '@clerk/nextjs/server';
import { addDays, isBefore, parseISO } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const TIMEZONE = 'America/Bogota';
const GRACE_PERIOD_DAYS = 2; // 2 días de período de gracia

export async function checkAndUpdateSubscriptions() {
	const nowUTC = new Date();
	const nowBogota = toDate(nowUTC, { timeZone: TIMEZONE });

	try {
		const activeUsers = await db.query.users.findMany({
			where: eq(users.subscriptionStatus, 'active'),
		});

		console.log('🔍 Checking subscriptions:', {
			totalActiveUsers: activeUsers.length,
			currentTime: formatInTimeZone(
				nowBogota,
				TIMEZONE,
				'yyyy-MM-dd HH:mm:ss zzz'
			),
			environment: process.env.NODE_ENV,
		});

		let deactivatedCount = 0;
		let stillActiveCount = 0;

		for (const user of activeUsers) {
			if (!user.subscriptionEndDate) continue;

			// Convertir la fecha de fin de suscripción a objeto Date
			const endDate =
				typeof user.subscriptionEndDate === 'string'
					? parseISO(user.subscriptionEndDate)
					: toDate(user.subscriptionEndDate, { timeZone: TIMEZONE });

			const gracePeriodEndDate = addDays(endDate, GRACE_PERIOD_DAYS);
			const daysOverdue = Math.floor(
				(nowBogota.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			console.log(`\n📊 Checking user ${user.email}:`, {
				endDate: formatInTimeZone(endDate, TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'),
				gracePeriodEnd: formatInTimeZone(
					gracePeriodEndDate,
					TIMEZONE,
					'yyyy-MM-dd HH:mm:ss zzz'
				),
				daysOverdue,
				hasExpired: isBefore(endDate, nowBogota),
				hasExpiredWithGrace: isBefore(gracePeriodEndDate, nowBogota),
			});

			if (isBefore(gracePeriodEndDate, nowBogota)) {
				deactivatedCount++;
				console.log(`🔄 Deactivating subscription for ${user.email}`);

				try {
					// Actualizar DB
					await db
						.update(users)
						.set({
							subscriptionStatus: 'inactive',
							updatedAt: new Date(),
						})
						.where(eq(users.id, user.id));

					// Actualizar Clerk
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
						console.log('✅ Updated:', {
							user: user.email,
							status: 'inactive',
							updatedAt: new Date().toISOString(),
						});
					}
				} catch (error) {
					console.error('❌ Update failed:', {
						user: user.email,
						error: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			} else {
				stillActiveCount++;
			}
		}

		return {
			usersChecked: activeUsers.length,
			deactivated: deactivatedCount,
			stillActive: stillActiveCount,
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
