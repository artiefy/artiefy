'use client';

import { useState, useEffect } from 'react';

import { useUser } from '@clerk/nextjs';
import { Bell, BellRing } from 'lucide-react';

import {
  getNotifications,
  getUnreadCount,
} from '~/server/actions/notifications/getNotifications';
import { markNotificationsAsRead } from '~/server/actions/notifications/markNotificationsAsRead';

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

  const handleClick = async () => {
    setIsOpen(!isOpen);

    // Mark notifications as read when opening the menu
    if (!isOpen && user?.id && unreadCount > 0) {
      try {
        await markNotificationsAsRead(user.id);
        setUnreadCount(0); // Update local state immediately
        // Refresh notifications to get updated read status
        const updatedNotifications = await getNotifications(user.id);
        setNotifications(updatedNotifications);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }

    // Solo aplicar animación en pantallas grandes
    if (window.innerWidth >= 768) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300); // Duración de la animación
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

      <div className={`notification-options ${isOpen ? 'show' : ''}`}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className="notification-item">
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-description">
                  {notification.message}
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
