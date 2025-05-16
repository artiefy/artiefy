'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { FaCrown } from 'react-icons/fa';

import { checkSubscriptionStatus } from '~/server/actions/estudiantes/subscriptions/checkSubscriptionStatus';
import './notificationSubscription.css';

export function NotificationSubscription() {
	const { user } = useUser();
	const [notification, setNotification] = useState<{
		message: string;
		severity: string;
	} | null>(null);

	useEffect(() => {
		if (!user) return;

		const subscriptionData = {
			subscriptionStatus: user.publicMetadata.subscriptionStatus as string,
			subscriptionEndDate: user.publicMetadata.subscriptionEndDate as string,
			planType: user.publicMetadata.planType as string,
		};

		const status = checkSubscriptionStatus(subscriptionData);
		if (status?.shouldNotify) {
			setNotification({
				message: status.message,
				severity: status.severity,
			});
		}
	}, [user]);

	if (!notification) return null;

	return (
		<div className="subscription-alert-inline">
			<div className="subscription-alert-content-inline">
				<div className="flex items-center gap-2">
					<FaCrown className={`alert-icon ${notification.severity}`} />
					<p className={`alert-message ${notification.severity} m-0`}>
						{notification.message}
						{' · '}
						<Link href="/planes" className="upgrade-link">
							Renovar suscripción
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
