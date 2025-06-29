import { clerkClient } from '@clerk/nextjs/server';
import { isBefore } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const TIMEZONE = 'America/Bogota';

export async function checkAndUpdateSubscriptions() {
  const nowUTC = new Date();
  const nowBogota = toDate(nowUTC, { timeZone: TIMEZONE });

  try {
    // Get all active users
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
    });

    let deactivatedCount = 0;
    let stillActiveCount = 0;

    for (const user of activeUsers) {
      if (!user.subscriptionEndDate) continue;

      let endDate: Date;
      if (typeof user.subscriptionEndDate === 'string') {
        // Solo soporta yyyy-MM-dd o yyyy-MM-dd HH:mm:ss
        const matchDash =
          /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/.exec(
            user.subscriptionEndDate
          );
        if (matchDash) {
          const [, year, month, day, hour = '0', min = '0', sec = '0'] =
            matchDash;
          endDate = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(min),
            Number(sec)
          );
        } else {
          // fallback: fecha inválida
          endDate = new Date('2100-01-01');
        }
      } else {
        endDate = toDate(user.subscriptionEndDate, { timeZone: TIMEZONE });
      }

      const hasExpired = isBefore(endDate, nowBogota);

      console.log(`\n📊 Checking user ${user.email}:`, {
        endDate: formatInTimeZone(endDate, TIMEZONE, 'yyyy-MM-dd HH:mm:ss zzz'),
        hasExpired,
      });

      if (hasExpired) {
        deactivatedCount++;
        console.log(`🔄 Deactivating subscription for ${user.email}`);

        try {
          // 1. Update Database: NO borres ni modifiques subscriptionEndDate
          await db
            .update(users)
            .set({
              subscriptionStatus: 'inactive',
              updatedAt: nowUTC,
              // subscriptionEndDate: user.subscriptionEndDate, // No modificar ni borrar
            })
            .where(eq(users.id, user.id));

          // 2. Update Clerk: NO borres ni modifiques subscriptionEndDate
          const clerk = await clerkClient();
          const clerkUser = await clerk.users.getUserList({
            emailAddress: [user.email],
          });

          if (clerkUser?.data?.[0]) {
            await clerk.users.updateUser(clerkUser.data[0].id, {
              publicMetadata: {
                subscriptionStatus: 'inactive',
                planType: user.planType,
                subscriptionEndDate: user.subscriptionEndDate, // Mantener la fecha original (string)
              },
            });

            console.log('✅ Updated:', {
              user: user.email,
              status: 'inactive',
              planType: user.planType,
              metadata: 'Clerk metadata updated',
              updatedAt: nowUTC.toISOString(),
            });
          }
        } catch (error) {
          console.error('❌ Update failed for user:', user.email, error);
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
    console.error('❌ Error in checkAndUpdateSubscriptions:', error);
    throw error;
  }
}
