import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toDate } from 'date-fns-tz';

const TIMEZONE = 'America/Bogota';

type SubscriptionData = {
	subscriptionStatus?: string | null;
	subscriptionEndDate?: string | Date | null;
	planType?: string | null;
} | null;

export function checkSubscriptionStatus(subscriptionData: SubscriptionData) {
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

	if (subscriptionData.subscriptionStatus === 'active') {
		if (diffDays <= 7 && diffDays > 3) {
			return {
				shouldNotify: true,
				message: `Tu suscripción ${planName} expirará en ${formatDistanceToNow(endDate, { locale: es })}`,
				severity: 'medium',
				daysLeft: diffDays,
			};
		}

		if (diffDays <= 3 && diffDays > 0) {
			return {
				shouldNotify: true,
				message: `¡ATENCIÓN! Tu suscripción ${planName} expirará en ${formatDistanceToNow(endDate, { locale: es })}`,
				severity: 'high',
				daysLeft: diffDays,
			};
		}
	}

	if (diffDays <= 0) {
		return {
			shouldNotify: true,
			message: `Tu suscripción ${planName} ha expirado`,
			severity: 'expired',
			daysLeft: 0,
		};
	}

	return null;
}
