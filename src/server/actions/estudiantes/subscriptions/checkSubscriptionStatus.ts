import { format, parseISO } from 'date-fns';
import { toDate } from 'date-fns-tz';

const TIMEZONE = 'America/Bogota';

type SubscriptionData = {
  subscriptionStatus?: string | null;
  subscriptionEndDate?: string | Date | null;
  planType?: string | null;
} | null;

/** Remembers, per browser, which day a recipient was already notified. */
const EMAIL_SENT_STORAGE_PREFIX = 'artiefy-subscription-email-sent';

/** Collapses the concurrent calls a single mount storm produces in one tab. */
const inFlightRecipients = new Set<string>();

const normalizeRecipient = (recipient: string) =>
  recipient.trim().toLowerCase();

const currentDayKey = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });

const storageKeyFor = (recipient: string) =>
  `${EMAIL_SENT_STORAGE_PREFIX}:${normalizeRecipient(recipient)}`;

/**
 * Browser-side half of the once-a-day rule. The subscription banner re-runs
 * this check on every navigation, so this skips the round trip entirely.
 * `claimDailySubscriptionEmail` on the server stays authoritative for other
 * devices, other tabs and cleared storage.
 */
function wasNotifiedToday(recipient: string) {
  if (typeof window === 'undefined') return false;
  try {
    const storedDay = window.localStorage.getItem(storageKeyFor(recipient));
    return storedDay === currentDayKey();
  } catch {
    // Blocked storage (private mode): let the server-side claim decide.
    return false;
  }
}

function markNotifiedToday(recipient: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKeyFor(recipient), currentDayKey());
  } catch {
    // Nothing to do — the server-side claim already prevents duplicates.
  }
}

async function sendEmailNotification(data: {
  to: string;
  userName: string;
  expirationDate: string;
  timeLeft: string;
  kind: 'reminder' | 'expired';
}) {
  const recipient = normalizeRecipient(data.to);
  if (!recipient) return false;
  if (wasNotifiedToday(recipient) || inFlightRecipients.has(recipient)) {
    return false;
  }

  inFlightRecipients.add(recipient);
  try {
    const response = await fetch('/api/email/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    // A skipped send still answers 200: the day is spent either way, so the
    // local flag must be set to stop further attempts from this browser.
    if (response.ok) markNotifiedToday(recipient);
    return response.ok;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  } finally {
    inFlightRecipients.delete(recipient);
  }
}

export async function checkSubscriptionStatus(
  subscriptionData: SubscriptionData,
  userEmail?: string,
  userName?: string // Nuevo: para personalizar el correo
) {
  if (!subscriptionData?.subscriptionStatus) {
    return null;
  }

  const isActive = subscriptionData.subscriptionStatus === 'active';

  // Sin fecha de fin no hay cuenta regresiva posible: solo se avisa si el
  // estado ya dice que la suscripción no está activa.
  if (!subscriptionData.subscriptionEndDate) {
    if (isActive) return null;

    return {
      shouldNotify: true,
      message: `Tu suscripción ${subscriptionData.planType ?? 'Plan actual'} ha expirado`,
      severity: 'expired',
      daysLeft: 0,
    };
  }

  const nowUTC = new Date();
  const bogotaNow = toDate(nowUTC, { timeZone: TIMEZONE });

  // Handle both string and Date types for subscriptionEndDate
  let endDate: Date;
  if (typeof subscriptionData.subscriptionEndDate === 'string') {
    // Soporta yyyy-MM-dd, yyyy/MM/dd y ISO
    const isoTry = parseISO(subscriptionData.subscriptionEndDate);
    if (!isNaN(isoTry.getTime())) {
      endDate = isoTry;
    } else {
      // yyyy/MM/dd
      const matchSlash = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(
        subscriptionData.subscriptionEndDate
      );
      if (matchSlash) {
        const [, year, month, day] = matchSlash;
        endDate = new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        // yyyy-MM-dd
        const matchDash = /^(\d{4})-(\d{2})-(\d{2})/.exec(
          subscriptionData.subscriptionEndDate
        );
        if (matchDash) {
          const [, year, month, day] = matchDash;
          endDate = new Date(Number(year), Number(month) - 1, Number(day));
        } else {
          // fallback: fecha inválida
          endDate = new Date('2100-01-01');
        }
      }
    }
  } else {
    endDate = toDate(subscriptionData.subscriptionEndDate, {
      timeZone: TIMEZONE,
    });
  }

  const diffDays = Math.ceil(
    (endDate.getTime() - bogotaNow.getTime()) / (1000 * 60 * 60 * 24)
  );

  const planName = subscriptionData.planType ?? 'Plan actual';

  // Notificación por correo en la cuenta regresiva. `diffDays === 0` queda
  // fuera a propósito: con la fecha ya cumplida el aviso que corresponde es el
  // de "expirada" que está más abajo, y antes se enviaban los dos el mismo día.
  if (isActive) {
    if ([7, 3, 1].includes(diffDays)) {
      if (userEmail) {
        await sendEmailNotification({
          to: userEmail,
          userName: userName ?? '',
          expirationDate: format(endDate, 'dd/MM/yyyy'),
          timeLeft: `${diffDays} día${diffDays === 1 ? '' : 's'}`,
          kind: 'reminder',
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

  // El aviso de expirada sale con CUALQUIERA de las dos condiciones: que el
  // estado ya no sea 'active', o que la fecha de fin haya pasado. Antes solo
  // se miraba la fecha, así que una cuenta marcada 'inactive' con fecha futura
  // no mostraba nada.
  if (!isActive || diffDays <= 0) {
    // El correo sigue atado a la fecha vencida para no reenviarlo por un
    // cambio de estado con la fecha todavía por delante.
    if (userEmail && diffDays <= 0) {
      await sendEmailNotification({
        to: userEmail,
        userName: userName ?? '',
        expirationDate: format(endDate, 'dd/MM/yyyy'),
        timeLeft: 'hoy',
        kind: 'expired',
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
