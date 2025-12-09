'use client';

import { useEffect, useState } from 'react';

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    subtitle?: string; // Información adicional (ej: status del webhook)
}

interface NotificationToastProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export function NotificationToast({ toasts, onRemove }: NotificationToastProps) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none sm:top-6 sm:right-6">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
}

interface ToastProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (!toast.duration) return;

        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast.duration, toast.id, onRemove]);

    const baseClasses = `
    pointer-events-auto
    flex items-start gap-3
    rounded-lg border
    px-4 py-3
    shadow-lg backdrop-blur
    transition-all duration-300
    animate-in fade-in slide-in-from-top-2
    sm:px-5 sm:py-4
  `;

    const typeClasses = {
        success: 'border-green-500/50 bg-green-950/80 text-green-300',
        error: 'border-red-500/50 bg-red-950/80 text-red-300',
        warning: 'border-blue-500/50 bg-blue-950/80 text-blue-300',
        info: 'border-cyan-500/50 bg-cyan-950/80 text-cyan-300',
    };

    const iconProps = {
        className: 'h-5 w-5 flex-shrink-0 mt-0.5',
    };

    const icons = {
        success: <CheckCircle {...iconProps} />,
        error: <AlertCircle {...iconProps} />,
        warning: <AlertCircle {...iconProps} />,
        info: <Info {...iconProps} />,
    };

    return (
        <div
            className={`
        ${baseClasses}
        ${typeClasses[toast.type]}
        ${isExiting ? 'opacity-0 slide-out-to-top-2' : ''}
      `}
        >
            <div className="flex-shrink-0">
                {icons[toast.type]}
            </div>
            <div className="flex-1 text-sm sm:text-base">
                {toast.message}
                {toast.subtitle && (
                    <p className="text-xs opacity-80 mt-1">{toast.subtitle}</p>
                )}
            </div>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => onRemove(toast.id), 300);
                }}
                className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Cerrar"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
