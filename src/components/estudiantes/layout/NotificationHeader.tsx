'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { Bell, BellRing } from 'lucide-react';

import {
  getNotifications,
  getUnreadCount,
} from '~/server/actions/estudiantes/notifications/getNotifications';
import { markNotificationsAsRead } from '~/server/actions/estudiantes/notifications/markNotificationsAsRead';

import type { Notification } from '~/types';

import '~/styles/menuNotification.css';

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  if (hours > 0) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (minutes > 0)
    return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  return 'Hace un momento';
}

export function NotificationHeader() {
  const router = useRouter();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      void getNotifications(user.id).then(setNotifications);
      void getUnreadCount(user.id).then(setUnreadCount);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-menu')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Optimizado: marca solo las notificaciones no leídas como leídas al abrir el menú
  const handleClick = async () => {
    setIsOpen(!isOpen);

    if (!isOpen && user?.id && unreadCount > 0) {
      try {
        // Marca solo las notificaciones no leídas
        await markNotificationsAsRead(user.id);
        // Actualiza localmente el estado de las notificaciones
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }

    if (window.innerWidth >= 768) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);

    switch (notification.type) {
      case 'LESSON_UNLOCKED':
        if (notification.metadata?.lessonId) {
          void router.push(
            `/estudiantes/clases/${notification.metadata.lessonId}`
          );
        }
        break;
      case 'COURSE_ENROLLMENT':
      case 'NEW_COURSE_ADDED':
        if (notification.metadata?.courseId) {
          void router.push(
            `/estudiantes/cursos/${notification.metadata.courseId}`
          );
        }
        break;
      case 'PROGRAM_ENROLLMENT':
        if (notification.metadata?.programId) {
          void router.push(
            `/estudiantes/programas/${notification.metadata.programId}`
          );
        }
        break;
      case 'ACTIVITY_COMPLETED':
        // Si hay lessonId y activityId, navega a la clase y abre el modal de la actividad tipo documento
        if (
          notification.metadata?.lessonId &&
          notification.metadata?.activityId
        ) {
          void router.push(
            `/estudiantes/clases/${notification.metadata.lessonId}?activityId=${notification.metadata.activityId}`
          );
        } else if (notification.metadata?.lessonId) {
          void router.push(
            `/estudiantes/clases/${notification.metadata.lessonId}`
          );
        }
        break;
      default:
        console.log('Tipo de notificación no manejado:', notification.type);
    }
  };

  return (
    <div className="notification-menu">
      <button
        className={`group md:hover:bg-primary notification-button relative ml-2 rounded-full p-2 transition-colors hover:bg-gray-800 ${
          isAnimating ? 'active' : ''
        }`}
        type="button"
        aria-label="Notificaciones"
        onClick={handleClick}
      >
        <span className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-white px-2 py-1 text-xs whitespace-nowrap text-black opacity-0 transition-opacity group-hover:opacity-100 md:block">
          Notificaciones
        </span>
        {unreadCount > 0 ? (
          <>
            <BellRing className="text-primary group-hover:text-background size-6 transition-colors" />
            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell className="text-primary group-hover:text-background size-6 transition-colors" />
        )}
      </button>

      <div
        className={`notification-options ${isOpen ? 'show' : ''}`}
        style={{
          maxHeight: '350px',
          overflowY: 'auto',
        }}
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${
                !notification.isRead ? 'notification-unread' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNotificationClick(notification);
                }
              }}
            >
              <div className="notification-content">
                <div className="notification-title">
                  {notification.title.replace('lección', 'clase')}
                </div>
                <div className="notification-description">
                  {notification.message.replace('lección', 'clase')}
                </div>
                <div className="notification-time">
                  {formatRelativeTime(notification.createdAt)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex min-h-[100px] items-center justify-center p-4">
            <div className="text-center">
              <Bell className="mx-auto mb-2 size-6 text-gray-400" />
              <p className="text-sm text-gray-500">No tienes notificaciones</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
