'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { Sparkles, TriangleAlert, X } from 'lucide-react';

import { checkSubscriptionStatus } from '~/server/actions/estudiantes/subscriptions/checkSubscriptionStatus';

import './notificationSubscription.css';

type NotificationSeverity = 'medium' | 'high' | 'expired';

type NotificationState = {
  daysLeft: number;
  message: string;
  planType: string;
  severity: NotificationSeverity;
} | null;

const getNotificationCopy = (
  severity: NotificationSeverity,
  planType: string,
  daysLeft: number
) => {
  if (severity === 'expired') {
    return {
      compactMessage: `${planType} expirado`,
      ctaLabel: 'Renovar',
      ctaLabelDesktop: 'Renovar ahora',
      desktopMessage: `Tu suscripción al plan ${planType} ha expirado`,
      desktopSupport:
        'Renueva ahora para continuar accediendo a todos los cursos.',
      icon: TriangleAlert,
    };
  }

  const pluralSuffix = daysLeft === 1 ? '' : 's';

  return {
    compactMessage: `${planType} expira en ${daysLeft} día${pluralSuffix}`,
    ctaLabel: 'Renovar',
    ctaLabelDesktop: 'Renovar plan',
    desktopMessage: `Tu suscripción ${planType} expira en ${daysLeft} día${pluralSuffix}`,
    desktopSupport: 'Mantén tu acceso ininterrumpido renovando tu plan.',
    icon: Sparkles,
  };
};

export function NotificationSubscription() {
  const { user } = useUser();
  const pathname = usePathname();
  const [notification, setNotification] = useState<NotificationState>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const isDashboardRoute = pathname?.startsWith('/dashboard');

  useEffect(() => {
    if (!user || isDashboardRoute) return;

    const subscriptionData = {
      subscriptionStatus: user.publicMetadata.subscriptionStatus as string,
      subscriptionEndDate: user.publicMetadata.subscriptionEndDate as string,
      planType: user.publicMetadata.planType as string,
    };

    const checkStatus = async () => {
      const status = await checkSubscriptionStatus(
        subscriptionData,
        user.primaryEmailAddress?.emailAddress
      );

      if (status?.shouldNotify) {
        setNotification({
          daysLeft: status.daysLeft ?? 0,
          message: status.message,
          planType: subscriptionData.planType || 'PRO',
          severity: status.severity as NotificationSeverity,
        });
        setIsDismissed(false);
      } else {
        setNotification(null);
      }
    };

    void checkStatus();
  }, [isDashboardRoute, user]);

  const notificationCopy = useMemo(() => {
    if (!notification) return null;

    return getNotificationCopy(
      notification.severity,
      notification.planType,
      notification.daysLeft
    );
  }, [notification]);

  if (isDashboardRoute || !notification || !notificationCopy || isDismissed) {
    return null;
  }

  const Icon = notificationCopy.icon;

  return (
    <div
      className={`
        artiefy-subscription-root
        severity-${notification.severity}
      `}
    >
      <div className="subscription-shell">
        <div className="subscription-banner">
          <div className="subscription-banner__content">
            <div className="subscription-banner__icon-shell">
              <div className="subscription-banner__icon-frame">
                <Icon className="subscription-banner__icon" />
              </div>
            </div>

            <p className="subscription-banner__mobile-copy">
              {notificationCopy.compactMessage}
            </p>

            <div className="subscription-banner__desktop-copy">
              <p className="subscription-banner__title">
                {notificationCopy.desktopMessage}
              </p>
              <span className="subscription-banner__support">
                {notificationCopy.desktopSupport}
              </span>
            </div>
          </div>

          <div className="subscription-banner__actions">
            <Link href="/planes" className="subscription-banner__cta">
              <span className="subscription-banner__cta-mobile">
                {notificationCopy.ctaLabel}
              </span>
              <span className="subscription-banner__cta-desktop">
                {notificationCopy.ctaLabelDesktop}
              </span>
            </Link>

            <button
              type="button"
              className="subscription-banner__close"
              aria-label="Cerrar notificación"
              onClick={() => setIsDismissed(true)}
            >
              <X className="subscription-banner__close-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
