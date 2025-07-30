import { clerkClient } from '@clerk/nextjs/server';
import { isBefore } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { eq } from 'drizzle-orm';

import { sendSubscriptionEmail } from '~/server/actions/estudiantes/email/sendSubscriptionEmail';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const TIMEZONE = 'America/Bogota';

// Añade el campo lastSubscriptionEmailSentAt al tipo de usuario localmente
interface UserWithSubscription {
  address: string | null;
  id: string;
  name: string | null;
  role: 'estudiante' | 'educador' | 'admin' | 'super-admin';
  email: string;
  createdAt: Date;
  updatedAt: Date;
  phone: string | null;
  subscriptionStatus: string;
  subscriptionEndDate: string | Date | null;
  planType: string | null;
  purchaseDate: Date | null;
  lastSubscriptionEmailSentAt?: Date | string | null; // <-- Añadido
}

export async function checkAndUpdateSubscriptions() {
  const nowUTC = new Date();
  const nowBogota = toDate(nowUTC, { timeZone: TIMEZONE });

  try {
    // Get all active users
    // Forzar el tipado correcto para los usuarios
    const activeUsers = (await db.query.users.findMany({
      where: eq(users.subscriptionStatus, 'active'),
    })) as UserWithSubscription[];

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

      // --- NUEVO: Lógica para aviso de expiración ---
      // Calcular días restantes
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysLeft = Math.ceil(
        (endDate.getTime() - nowBogota.getTime()) / msPerDay
      );

      // Solo enviar si faltan 7, 3, 1 o 0 días
      const shouldNotify =
        daysLeft === 7 || daysLeft === 3 || daysLeft === 1 || daysLeft === 0;

      // Verificar si ya se envió correo hoy
      let lastSent: Date | null = null;
      if (user.lastSubscriptionEmailSentAt) {
        lastSent =
          typeof user.lastSubscriptionEmailSentAt === 'string'
            ? new Date(user.lastSubscriptionEmailSentAt)
            : user.lastSubscriptionEmailSentAt;
      }
      const alreadySentToday =
        lastSent &&
        nowBogota.getFullYear() === lastSent.getFullYear() &&
        nowBogota.getMonth() === lastSent.getMonth() &&
        nowBogota.getDate() === lastSent.getDate();

      if (shouldNotify && !alreadySentToday) {
        // Determinar texto para timeLeft
        let timeLeftText = '';
        if (daysLeft === 0) timeLeftText = 'hoy';
        else if (daysLeft === 1) timeLeftText = '1 día';
        else timeLeftText = `${daysLeft} días`;

        try {
          await sendSubscriptionEmail({
            to: user.email,
            userName: user.name ?? '',
            expirationDate: formatInTimeZone(endDate, TIMEZONE, 'yyyy-MM-dd'),
            timeLeft: timeLeftText,
          });

          console.log(
            `📧 Notificación de suscripción enviada a ${user.email} (faltan ${timeLeftText})`
          );
        } catch (error) {
          console.error(
            '❌ Error enviando notificación de suscripción:',
            error
          );
        }
      }
      // --- FIN NUEVO ---

      if (hasExpired) {
        deactivatedCount++;
        console.log(`🔄 Deactivating subscription for ${user.email}`);

        try {
          // 1. Update Database: NO borres ni modifiques subscriptionEndDate
          // Formatea la fecha de expiración a zona Bogotá y formato deseado
          let formattedEndDate = user.subscriptionEndDate;
          if (user.subscriptionEndDate) {
            let endDateObj: Date;
            if (typeof user.subscriptionEndDate === 'string') {
              // Soporta yyyy-MM-dd o yyyy-MM-dd HH:mm:ss
              const matchDash =
                /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/.exec(
                  user.subscriptionEndDate
                );
              if (matchDash) {
                const [, year, month, day, hour = '0', min = '0', sec = '0'] =
                  matchDash;
                endDateObj = new Date(
                  Number(year),
                  Number(month) - 1,
                  Number(day),
                  Number(hour),
                  Number(min),
                  Number(sec)
                );
              } else {
                endDateObj = new Date(user.subscriptionEndDate);
              }
            } else {
              endDateObj = toDate(user.subscriptionEndDate, {
                timeZone: TIMEZONE,
              });
            }
            formattedEndDate = formatInTimeZone(
              endDateObj,
              TIMEZONE,
              'yyyy-MM-dd HH:mm:ss'
            );
          }

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
                subscriptionEndDate: formattedEndDate, // <-- formato Bogotá
              },
            });

            console.log('✅ Updated:', {
              user: user.email,
              status: 'inactive',
              planType: user.planType,
              metadata: 'Clerk metadata updated',
              updatedAt: nowUTC.toISOString(),
              subscriptionEndDate: formattedEndDate,
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
