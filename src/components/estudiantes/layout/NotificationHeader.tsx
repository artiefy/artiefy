'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { Bell, BellRing } from 'lucide-react';
import { toast } from 'react-toastify';
import useSWR from 'swr';

import { Dialog } from '~/components/estudiantes/ui/dialog';
import ModalInvitaciones from '~/components/projects/Modals/ModalInvitaciones';
import ModalSolicitudesParticipacion from '~/components/projects/Modals/ModalSolicitudesParticipacion';
import {
  getNotifications,
  getUnreadCount,
} from '~/server/actions/estudiantes/notifications/getNotifications';
import { markNotificationsAsRead } from '~/server/actions/estudiantes/notifications/markNotificationsAsRead';
import { checkProjectActivitiesDueForUser } from '~/server/actions/estudiantes/projects/checkProjectActivitiesDue';

import type {
  Notification as BaseNotification,
  NotificationMetadata as BaseNotificationMetadata,
  NotificationType as BaseNotificationType,
} from '~/types';

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

// Extiende NotificationType para permitir 'participation-request' y 'PROJECT_INVITATION'
type NotificationType =
  | BaseNotificationType
  | 'participation-request'
  | 'PROJECT_INVITATION'
  | 'TICKET_REPLY'
  | 'TICKET_STATUS_CHANGED'
  | 'PROJECT_ACTIVITY_DUE';

// Extiende NotificationMetadata para permitir projectId y requestType
type NotificationMetadata = BaseNotificationMetadata & {
  projectId?: number;
  projectName?: string;
  requestType?: 'participation' | 'resignation';
  ticketId?: number;
  daysLeft?: number;
};

// Extiende Notification para usar los tipos ampliados
type Notification = Omit<BaseNotification, 'type' | 'metadata'> & {
  type: NotificationType;
  metadata?: NotificationMetadata;
};

const renderNotificationTitle = (notification: Notification) =>
  notification.title.replace('lección', 'clase');

const renderNotificationDescription = (notification: Notification) => {
  const baseMessage = notification.message.replace('lección', 'clase');
  if (
    notification.type === 'PROJECT_ACTIVITY_DUE' &&
    notification.metadata?.projectName &&
    baseMessage.includes(notification.metadata.projectName)
  ) {
    const [before, ...rest] = baseMessage.split(
      notification.metadata.projectName
    );
    const after = rest.join(notification.metadata.projectName);
    return (
      <>
        {before}
        <span className="font-semibold text-foreground">
          {notification.metadata.projectName}
        </span>
        {after}
      </>
    );
  }
  return baseMessage;
};

export function NotificationHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalProyectoId, setModalProyectoId] = useState<number | null>(null);
  const [modalInvitacionesOpen, setModalInvitacionesOpen] = useState(false);
  const hasCheckedDueRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const hasCheckedInvitationParamRef = useRef(false);

  // SWR para notificaciones y contador de no leídas (actualiza cada 10s)
  // Cambia el límite en getNotifications para traer todas las notificaciones del usuario
  const { data: notifications = [], mutate } = useSWR(
    user?.id ? ['/api/notifications', user.id] : null,
    async () =>
      user?.id ? await getNotifications(user.id, { limit: 1000 }) : [], // <-- trae todas
    { refreshInterval: 10000 }
  );
  const { data: unreadCount = 0, mutate: mutateUnread } = useSWR(
    user?.id ? ['/api/notifications/unread', user.id] : null,
    async () => (user?.id ? await getUnreadCount(user.id) : 0),
    { refreshInterval: 10000 }
  );

  useEffect(() => {
    // Ya no necesitas setNotifications ni setUnreadCount aquí, SWR se encarga
  }, [user?.id]);

  // Detectar parámetro acceptInvitation en la URL y abrir modal
  useEffect(() => {
    if (hasCheckedInvitationParamRef.current) return;

    const acceptInvitation = searchParams.get('acceptInvitation');
    if (acceptInvitation && user?.id) {
      hasCheckedInvitationParamRef.current = true;
      setModalInvitacionesOpen(true);

      // Limpiar el parámetro de la URL
      const url = new URL(window.location.href);
      url.searchParams.delete('acceptInvitation');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, user?.id]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.id || hasCheckedDueRef.current) return;
    hasCheckedDueRef.current = true;

    const runCheck = async () => {
      try {
        const result = await checkProjectActivitiesDueForUser(user.id);

        if (!isMountedRef.current) return;

        if (result?.nextRunAt) {
          const nextTime = new Date(result.nextRunAt).getTime();
          const delayMs = Math.max(0, nextTime - Date.now());
          if (delayMs > 0) {
            retryTimeoutRef.current = setTimeout(() => {
              if (!isMountedRef.current) return;
              void checkProjectActivitiesDueForUser(user.id).finally(() => {
                mutate();
                mutateUnread();
              });
            }, delayMs);
            return;
          }
        }

        mutate();
        mutateUnread();
      } catch (error) {
        console.error('Error verificando actividades de proyecto:', error);
      }
    };

    void runCheck();
  }, [user?.id, mutate, mutateUnread]);

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
        await markNotificationsAsRead(user.id);
        // Refresca los datos con SWR
        mutate();
        mutateUnread();
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

    // Si es notificación de solicitud de participación, abre el modal de solicitudes
    if (
      notification.type === 'participation-request' &&
      notification.metadata?.projectId !== undefined
    ) {
      setModalProyectoId(notification.metadata.projectId);
      return;
    }

    // Si es notificación de invitación a proyecto, abre el modal de invitaciones
    if (notification.type === 'PROJECT_INVITATION') {
      setModalInvitacionesOpen(true);
      return;
    }

    // Si es notificación de respuesta a ticket, abre el chatbot con ese ticket
    if (
      (notification.type === 'TICKET_REPLY' ||
        notification.type === 'TICKET_STATUS_CHANGED') &&
      notification.metadata?.ticketId !== undefined
    ) {
      // Emitir evento para abrir el chatbot con el ticket específico
      const event = new CustomEvent('open-ticket-chat', {
        detail: { ticketId: notification.metadata.ticketId },
      });
      window.dispatchEvent(event);
      return;
    }

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
      case 'PROJECT_ACTIVITY_DUE':
        if (notification.metadata?.projectId) {
          const activityQuery = notification.metadata?.activityId
            ? `?activityId=${notification.metadata.activityId}`
            : '';
          void router.push(
            `/estudiantes/projects/${notification.metadata.projectId}${activityQuery}`
          );
        }
        break;
      default:
        console.log('Tipo de notificación no manejado:', notification.type);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/notifications/delete?id=${notificationId}`,
        {
          method: 'DELETE',
        }
      );
      // Tipa la respuesta para evitar el warning de acceso inseguro
      interface DeleteResponse {
        success: boolean;
      }
      const result: DeleteResponse = await res.json();
      if (res.ok && result.success) {
        mutate(); // Refresca la lista de notificaciones con SWR
        mutateUnread(); // Refresca el contador de no leídas
        setDeleteId(null);
      } else {
        toast.error('No se pudo eliminar la notificación de la base de datos');
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      toast.error('Error eliminando notificación');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtra notificaciones duplicadas (solo muestra la más reciente por tipo y metadata.activityId/lessonId)
  const uniqueNotifications = notifications.reduce<Notification[]>(
    (acc, notif) => {
      const isDuplicate = acc.some(
        (n) =>
          n.type === notif.type &&
          n.metadata?.activityId === notif.metadata?.activityId &&
          n.metadata?.lessonId === notif.metadata?.lessonId &&
          n.metadata?.daysLeft === notif.metadata?.daysLeft
      );
      if (!isDuplicate) acc.push(notif);
      return acc;
    },
    []
  );

  // Modal de confirmación para eliminar notificación
  // Solo renderiza el modal si deleteId !== null
  return (
    <div className="notification-menu">
      <button
        className={`group notification-button relative ml-2 rounded-full p-2 transition-colors hover:bg-gray-800 md:hover:bg-primary ${
          isAnimating ? 'active' : ''
        }`}
        type="button"
        aria-label="Notificaciones"
        onClick={handleClick}
      >
        <span className="absolute top-1/2 left-full hidden translate-x-2 -translate-y-1/2 rounded bg-white px-2 py-1 text-[10px] whitespace-nowrap text-black opacity-0 transition-opacity group-hover:opacity-100 md:block">
          Notificaciones
        </span>
        {unreadCount > 0 ? (
          <>
            <BellRing className="size-6 text-primary transition-colors group-hover:text-background" />
            <span className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell className="size-6 text-primary transition-colors group-hover:text-background" />
        )}
      </button>

      <div
        className={`notification-options ${isOpen ? 'show' : ''}`}
        style={{
          maxHeight: '350px',
          overflowY: 'auto',
        }}
      >
        {uniqueNotifications.length > 0 ? (
          uniqueNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item group ${
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
              style={{ position: 'relative' }}
            >
              <div className="notification-content">
                <div className="notification-title">
                  {renderNotificationTitle(notification)}
                </div>
                <div className="notification-description">
                  {renderNotificationDescription(notification)}
                </div>
                <div className="notification-time">
                  {formatRelativeTime(notification.createdAt)}
                </div>
              </div>
              {/* Icono de basura visible solo al hacer hover */}
              <button
                className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                title="Eliminar notificación"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(notification.id);
                }}
                type="button"
              >
                <svg
                  className="size-5 text-red-500 hover:text-red-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
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
      {/* Modal de confirmación para eliminar notificación */}
      {deleteId !== null && (
        <Dialog open={true} onOpenChange={(open) => !open && setDeleteId(null)}>
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24 sm:pt-32">
            <div className="w-full max-w-xs rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Eliminar notificación
              </h2>
              <p className="mb-6 text-gray-700">
                ¿Estás seguro que deseas eliminar esta notificación?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  onClick={() => deleteId && handleDeleteNotification(deleteId)}
                  disabled={isDeleting}
                  type="button"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
      {/* NUEVO: Modal de invitaciones a proyectos */}
      {modalInvitacionesOpen && user?.id && (
        <ModalInvitaciones
          isOpen={modalInvitacionesOpen}
          onClose={() => setModalInvitacionesOpen(false)}
          userId={user.id}
        />
      )}
      {/* NUEVO: Modal de solicitudes de participación de proyecto */}
      {modalProyectoId !== null && user?.id && (
        <ModalSolicitudesParticipacion
          isOpen={true}
          onClose={() => setModalProyectoId(null)}
          projectId={modalProyectoId}
          userId={user.id}
        />
      )}
    </div>
  );
}
