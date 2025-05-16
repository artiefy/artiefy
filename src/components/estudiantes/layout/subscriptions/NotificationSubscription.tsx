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
	const [isExpanded, setIsExpanded] = useState(false);

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

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<div
			className={`subscription-alert-inline ${
				isExpanded
					? 'subscription-alert-expanded'
					: 'subscription-alert-collapsed'
			}`}
			onClick={toggleExpand}
		>
			<div
				className={`subscription-alert-content-inline ${
					notification.severity === 'high'
						? 'border-red-500 bg-red-50'
						: 'border-yellow-500 bg-yellow-50'
				}`}
			>
				<div className="flex items-center gap-3">
					<FaCrown
						className={`size-5 ${
							notification.severity === 'high'
								? 'text-red-500'
								: 'text-yellow-500'
						}`}
					/>
					<span
						className={`alert-message ${
							notification.severity === 'high'
								? 'text-red-700'
								: 'text-yellow-700'
						}`}
					>
						{notification.message}
						{' · '}
						<Link
							href="/planes"
							className="upgrade-link"
							onClick={(e) => e.stopPropagation()}
						>
							Renovar suscripción
						</Link>
					</span>
				</div>
			</div>
		</div>
	);
}
