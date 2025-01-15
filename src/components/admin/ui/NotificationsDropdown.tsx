'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '~/components/admin/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '~/components/admin/ui/dropdown-menu';

interface Notification {
    id: number;
    message: string;
    type: 'update' | 'student' | 'event';
    read: boolean;
    timestamp: Date;
}

export function NotificationsDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Simulating fetching notifications from an API
        const fetchNotifications = () => {
            const newNotifications: Notification[] = [
                {
                    id: 1,
                    message: 'Nueva actualización de la plataforma',
                    type: 'update',
                    read: false,
                    timestamp: new Date(),
                },
                {
                    id: 2,
                    message: 'Estudiante Juan Pérez agregado',
                    type: 'student',
                    read: false,
                    timestamp: new Date(Date.now() - 3600000),
                },
                {
                    id: 3,
                    message: 'Nuevo evento: Reunión de profesores',
                    type: 'event',
                    read: false,
                    timestamp: new Date(Date.now() - 7200000),
                },
            ];
            setNotifications(newNotifications);
            setUnreadCount(newNotifications.filter((n) => !n.read).length);
        };

        fetchNotifications();
        // In a real application, you might want to set up a websocket or polling mechanism here
    }, []);

    const markAsRead = (id: number) => {
        setNotifications(
            notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => prev - 1);
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000
        );

        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex size-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="max-h-96 w-80 overflow-y-auto"
            >
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <DropdownMenuItem disabled>
                        No hay notificaciones
                    </DropdownMenuItem>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className="flex flex-col items-start p-4"
                        >
                            <div className="flex w-full justify-between">
                                <span
                                    className={`text-sm ${notification.read ? 'text-muted-foreground' : 'font-semibold'}`}
                                >
                                    {notification.message}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {formatTimestamp(notification.timestamp)}
                                </span>
                            </div>
                            {!notification.read && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                    }}
                                    className="mt-2 h-auto p-0 font-normal text-blue-500 hover:text-blue-700"
                                >
                                    Marcar como leída
                                </Button>
                            )}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
