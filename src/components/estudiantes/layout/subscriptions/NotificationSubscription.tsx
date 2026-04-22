'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { X } from 'lucide-react';
import { FaCrown, FaStar } from 'react-icons/fa';

import { checkSubscriptionStatus } from '~/server/actions/estudiantes/subscriptions/checkSubscriptionStatus';

import './notificationSubscription.css';

type NotificationSeverity = 'medium' | 'high' | 'expired';

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
  const isPremium = planType === 'Premium';
  const pluralSuffix = daysLeft === 1 ? '' : 's';

  if (severity === 'expired') {
    return {
      compactMessage: `${planType} expirado`,
      ctaLabelDesktop: 'Renovar ahora',
      desktopMessage: `Tu suscripción ${planType} ha expirado`,
      desktopSupport:
        'Renueva ahora para continuar accediendo a todos los cursos.',
      isPremium,
      planType,
    };
  }

  return {
    compactMessage: `${planType} expira en ${daysLeft} día${pluralSuffix}`,
    ctaLabelDesktop: 'Renovar plan',
    desktopMessage: `Tu suscripción ${planType} expira en ${daysLeft} día${pluralSuffix}`,
    desktopSupport: 'Mantén tu acceso ininterrumpido renovando tu plan.',
    isPremium,
    planType,
  };
};

export function NotificationSubscription() {
  const { user } = useUser();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
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

  const PlanIcon = notificationCopy.isPremium ? FaCrown : FaStar;

  return (
    <div
      ref={rootRef}
      className={`
        artiefy-subscription-root
        severity-${notification.severity}
      `}
      role="alert"
    >
      <div aria-hidden="true" className="subscription-banner__sweep" />
      <div className="subscription-banner__line subscription-banner__line--top" />
      <div className="subscription-banner__line subscription-banner__line--bottom" />
      <div
        className="
          relative container flex items-center justify-between gap-2 py-2
          sm:gap-3 sm:px-4 sm:py-2.5
        "
      >
        <div
          className="
            flex min-w-0 flex-1 items-center gap-2
            sm:gap-3
          "
        >
          <div
            className={`
              subscription-plan-icon
              ${notificationCopy.isPremium ? 'is-premium' : 'is-pro'}
              ${notification.severity === 'expired' ? 'is-expired' : ''}
              ${notification.severity === 'expired' ? 'is-static' : 'is-animated'}
              flex size-8 flex-shrink-0 items-center justify-center rounded-lg
              sm:size-9 sm:rounded-xl
            `}
          >
            <PlanIcon
              className="
                size-3.5 drop-shadow-[0_0_4px_currentColor]
                sm:size-4
              "
            />
          </div>

          <p
            className="
              truncate text-[13px] font-semibold text-foreground
              sm:hidden
            "
          >
            {notificationCopy.compactMessage}
          </p>

          <div
            className="
              hidden min-w-0
              sm:flex sm:items-center sm:gap-2
            "
          >
            <p className="truncate text-sm font-semibold text-foreground">
              {notificationCopy.desktopMessage}
            </p>
            <span
              className="
                hidden text-xs text-muted-foreground
                md:inline
              "
            >
              · {notificationCopy.desktopSupport}
            </span>
          </div>
        </div>

        <div
          className="
            flex flex-shrink-0 items-center gap-1.5
            sm:gap-2
          "
        >
          <Link
            href="/planes"
            className="
              group relative overflow-hidden rounded-full bg-gradient-to-r
              from-primary via-primary/90 to-primary px-3 py-1.5 text-[11px]
              font-semibold whitespace-nowrap text-background
              shadow-[0_0_15px_hsl(var(--primary)/0.35)] transition-all
              hover:scale-[1.04] hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)]
              sm:px-5 sm:text-sm
            "
          >
            <span className="relative z-10">
              <span className="sm:hidden">Renovar</span>
              <span
                className="
                  hidden
                  sm:inline
                "
              >
                {notificationCopy.ctaLabelDesktop}
              </span>
            </span>
            <span
              className="
                absolute inset-0 -translate-x-full bg-gradient-to-r
                from-transparent via-white/30 to-transparent
                transition-transform duration-700
                group-hover:translate-x-full
              "
            />
          </Link>

          <button
            type="button"
            className="
              hidden size-7 items-center justify-center rounded-full
              text-muted-foreground transition-colors
              hover:bg-white/10 hover:text-foreground
              sm:flex
            "
            aria-label="Cerrar"
            onClick={() => setIsDismissed(true)}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
