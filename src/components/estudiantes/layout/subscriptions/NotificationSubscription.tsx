'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { X } from 'lucide-react';

import { checkSubscriptionStatus } from '~/server/actions/estudiantes/subscriptions/checkSubscriptionStatus';

import './notificationSubscription.css';

type NotificationSeverity = 'medium' | 'high' | 'grace' | 'expired';

// Clave para persistir el cierre del aviso durante la sesión de navegación.
// Se guarda la severidad cerrada para que, si el estado escala (p. ej. de
// "expira pronto" a "expirado"), el aviso vuelva a mostrarse.
const DISMISS_STORAGE_KEY = 'artiefy-subscription-dismissed';

type NotificationState = {
  daysLeft: number;
  message: string;
  planType: string;
  severity: NotificationSeverity;
} | null;

const normalizePlanType = (planType?: string) => {
  const normalized = (planType ?? 'PRO').trim().toLowerCase();

  if (normalized === 'premium') {
    return 'Premium';
  }

  return 'PRO';
};

const getNotificationCopy = (
  severity: NotificationSeverity,
  rawPlanType: string,
  daysLeft: number
) => {
  const planType = normalizePlanType(rawPlanType);
  const days = `${daysLeft} día${daysLeft === 1 ? '' : 's'}`;

  // Red: more than 5 days past the end date.
  if (severity === 'expired') {
    return {
      compactMessage: `${planType} expiró`,
      ctaLabel: 'Renovar ahora',
      desktopMessage: `Tu suscripción ${planType} expiró`,
    };
  }

  // Yellow: from the end date itself, counting down the 5 days left to renew.
  if (severity === 'grace') {
    return {
      compactMessage: `${planType} expiró · ${days} para renovar`,
      ctaLabel: 'Renovar plan',
      desktopMessage: `Tu suscripción ${planType} expiró, tienes ${days} para renovarla`,
    };
  }

  // Blue: the last 5 days before the end date.

  return {
    compactMessage: `${planType} expira en ${days}`,
    ctaLabel: 'Renovar plan',
    desktopMessage: `Tu suscripción ${planType} expira en ${days}`,
  };
};

export function NotificationSubscription() {
  const { user } = useUser();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState<NotificationState>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const shouldRenderSpacer = pathname !== '/';

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
        user.primaryEmailAddress?.emailAddress,
        user.firstName ?? undefined
      );

      if (status?.shouldNotify) {
        const severity = status.severity as NotificationSeverity;
        setNotification({
          daysLeft: status.daysLeft ?? 0,
          message: status.message,
          planType: subscriptionData.planType || 'PRO',
          severity,
        });
        // No reabrir si el usuario ya lo cerró con la X para esta severidad.
        const dismissedSeverity =
          typeof window !== 'undefined'
            ? window.sessionStorage.getItem(DISMISS_STORAGE_KEY)
            : null;
        setIsDismissed(dismissedSeverity === severity);
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

  useEffect(() => {
    if (isDashboardRoute || !notification || isDismissed) {
      document.documentElement.style.setProperty(
        '--subscription-banner-height',
        '0px'
      );
      return;
    }

    const updateHeight = () => {
      const height = rootRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty(
        '--subscription-banner-height',
        `${height}px`
      );
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (rootRef.current) {
      resizeObserver.observe(rootRef.current);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.setProperty(
        '--subscription-banner-height',
        '0px'
      );
    };
  }, [isDashboardRoute, isDismissed, notification]);

  if (isDashboardRoute || !notification || !notificationCopy || isDismissed) {
    return null;
  }

  const tone =
    notification.severity === 'expired'
      ? 'expired'
      : notification.severity === 'grace'
        ? 'grace'
        : 'upcoming';

  return (
    <>
      {shouldRenderSpacer && (
        <div aria-hidden="true" className="artiefy-subscription-spacer" />
      )}
      <div
        ref={rootRef}
        className={`artiefy-subscription-root tone-${tone}`}
        role="alert"
      >
        <div
          className="
            relative container flex flex-nowrap items-center justify-between
            gap-2 py-1
            sm:gap-3
          "
        >
          <p
            className="
              min-w-0 truncate text-xs leading-none font-semibold
              text-foreground
              sm:text-[13px]
            "
          >
            <span className="sm:hidden">{notificationCopy.compactMessage}</span>
            <span
              className="
                hidden
                sm:inline
              "
            >
              {notificationCopy.desktopMessage}
            </span>
          </p>

          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <Link
              href="/planes"
              className="
                subscription-banner__cta text-xs leading-none font-semibold
                whitespace-nowrap underline-offset-4
                hover:underline
                sm:text-[13px]
              "
            >
              {notificationCopy.ctaLabel}
            </Link>

            <button
              type="button"
              className="
                flex size-5 items-center justify-center rounded-full
                text-muted-foreground transition-colors
                hover:bg-white/10 hover:text-foreground
              "
              aria-label="Cerrar"
              onClick={() => {
                setIsDismissed(true);
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem(
                    DISMISS_STORAGE_KEY,
                    notification.severity
                  );
                }
              }}
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
