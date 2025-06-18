import { format, parseISO } from 'date-fns';
import { toDate } from 'date-fns-tz';

const TIMEZONE = 'America/Bogota';

type SubscriptionData = {
  subscriptionStatus?: string | null;
  subscriptionEndDate?: string | Date | null;
  planType?: string | null;
} | null;

async function sendEmailNotification(data: {
  to: string;
  userName: string;
  expirationDate: string;
  timeLeft: string;
}) {
  try {
    const response = await fetch('/api/email/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function checkSubscriptionStatus(
  subscriptionData: SubscriptionData,
  userEmail?: string,
  userName?: string // Nuevo: para personalizar el correo
) {
  if (
    !subscriptionData?.subscriptionEndDate ||
    !subscriptionData.subscriptionStatus
  ) {
    return null;
  }

  const nowUTC = new Date();
  const bogotaNow = toDate(nowUTC, { timeZone: TIMEZONE });

  // Handle both string and Date types for subscriptionEndDate
  const endDate =
    typeof subscriptionData.subscriptionEndDate === 'string'
      ? parseISO(subscriptionData.subscriptionEndDate)
      : toDate(subscriptionData.subscriptionEndDate, { timeZone: TIMEZONE });

  const diffDays = Math.ceil(
    (endDate.getTime() - bogotaNow.getTime()) / (1000 * 60 * 60 * 24)
  );

  const planName = subscriptionData.planType ?? 'Plan actual';

  // Notificación por correo para 7 días, 3 días y el mismo día
  if (subscriptionData.subscriptionStatus === 'active') {
    if ([7, 3, 1, 0].includes(diffDays)) {
      if (userEmail) {
        await sendEmailNotification({
          to: userEmail,
          userName: userName ?? '',
          expirationDate: format(endDate, 'dd/MM/yyyy'),
          timeLeft:
            diffDays > 0
              ? `${diffDays} día${diffDays === 1 ? '' : 's'}`
              : 'hoy',
        });
      }
    }

    if (diffDays <= 7 && diffDays > 3) {
      return {
        shouldNotify: true,
        message: `Tu suscripción ${planName} expirará en ${diffDays} días`,
        severity: 'medium',
        daysLeft: diffDays,
      };
    }

    if (diffDays <= 3 && diffDays > 0) {
      if (diffDays >= 1) {
        return {
          shouldNotify: true,
          message: `¡ATENCIÓN! Tu suscripción ${planName} expirará en ${diffDays} días`,
          severity: 'high',
          daysLeft: diffDays,
        };
      } else {
        const hours = Math.round(
          (endDate.getTime() - bogotaNow.getTime()) / (1000 * 60 * 60)
        );
        return {
          shouldNotify: true,
          message: `¡ATENCIÓN! Tu suscripción ${planName} expirará en ${hours} horas`,
          severity: 'high',
          daysLeft: diffDays,
        };
      }
    }
  }

  if (diffDays <= 0) {
    if (userEmail) {
      await sendEmailNotification({
        to: userEmail,
        userName: userName ?? '',
        expirationDate: format(endDate, 'dd/MM/yyyy'),
        timeLeft: 'hoy',
      });
    }
    return {
      shouldNotify: true,
      message: `Tu suscripción ${planName} ha expirado`,
      severity: 'expired',
      daysLeft: 0,
    };
  }

  return null;
}
