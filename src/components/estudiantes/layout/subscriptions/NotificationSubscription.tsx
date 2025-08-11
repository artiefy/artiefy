"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useUser } from "@clerk/nextjs";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCrown,
  FaExclamationTriangle,
} from "react-icons/fa";

import { checkSubscriptionStatus } from "~/server/actions/estudiantes/subscriptions/checkSubscriptionStatus";

import "./notificationSubscription.css";

export function NotificationSubscription() {
  const { user } = useUser();
  const [notification, setNotification] = useState<{
    message: string;
    severity: string;
  } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const subscriptionData = {
      subscriptionStatus: user.publicMetadata.subscriptionStatus as string,
      subscriptionEndDate: user.publicMetadata.subscriptionEndDate as string,
      planType: user.publicMetadata.planType as string,
    };

    const checkStatus = async () => {
      const status = await checkSubscriptionStatus(
        subscriptionData,
        user.primaryEmailAddress?.emailAddress,
      );
      if (status?.shouldNotify) {
        setNotification({
          message: status.message,
          severity: status.severity,
        });
      }
    };

    void checkStatus();
  }, [user]);

  if (!notification) return null;

  return (
    <div className="artiefy-subscription-root">
      <div
        className={`subscription-alert-inline ${isCollapsed ? "collapsed" : ""}`}
      >
        <div
          className={`subscription-alert-content-inline ${
            notification.severity === "expired"
              ? "border-gray-500 bg-gray-100"
              : notification.severity === "high"
                ? "border-red-500 bg-red-50"
                : "border-yellow-500 bg-yellow-50"
          }`}
        >
          <div className="alert-message">
            <div className="flex items-center gap-2">
              {notification.severity === "expired" ? (
                <FaExclamationTriangle className="size-5 text-gray-500" />
              ) : (
                <FaCrown
                  className={`size-5 ${
                    notification.severity === "high"
                      ? "text-red-500"
                      : "text-yellow-500"
                  }`}
                />
              )}
              <span
                className={
                  notification.severity === "expired"
                    ? "text-gray-700"
                    : notification.severity === "high"
                      ? "text-red-700"
                      : "text-yellow-700"
                }
              >
                <span className="alert-message-text">
                  {notification.message}
                </span>
                <Link href="/planes" className="upgrade-link">
                  Renovar suscripción
                </Link>
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mobile-toggle-button"
            aria-label={
              isCollapsed ? "Expandir notificación" : "Contraer notificación"
            }
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
      </div>
    </div>
  );
}
