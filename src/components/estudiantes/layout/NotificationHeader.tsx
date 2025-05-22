'use client';

import { useState, useEffect } from 'react';

import { Bell, BellRing } from 'lucide-react';
import '~/styles/menuNotification.css';

interface NotificationHeaderProps {
	count?: number;
}

export function NotificationHeader({ count = 0 }: NotificationHeaderProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);

	// Datos de ejemplo para las notificaciones
	const notifications = [
		{
			id: 1,
			title: 'Nuevo curso disponible',
			description: '¡El curso de React Avanzado ya está disponible!',
			time: 'Hace 5 minutos',
		},
		{
			id: 2,
			title: 'Certificación completada',
			description: 'Has completado la certificación de JavaScript',
			time: 'Hace 1 hora',
		},
		{
			id: 3,
			title: 'Recordatorio de clase',
			description: 'Tu próxima clase comienza en 30 minutos',
			time: 'Hace 2 horas',
		},
		{
			id: 4,
			title: 'Nueva insignia desbloqueada',
			description: '¡Has desbloqueado la insignia de Desarrollador Full Stack!',
			time: 'Hace 1 día',
		},
	];

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

	const handleClick = () => {
		setIsOpen(!isOpen);
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
				{count > 0 ? (
					<>
						<BellRing className="notification-icon md:text-primary text-background md:group-hover:text-background group-hover:text-primary size-6 transition-colors" />
						<span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
							{count}
						</span>
					</>
				) : (
					<Bell className="notification-icon text-background md:group-hover:text-background group-hover:text-primary size-6 transition-colors md:text-gray-600" />
				)}
			</button>

			<div className={`notification-options ${isOpen ? 'show' : ''}`}>
				{notifications.map((notification) => (
					<div key={notification.id} className="notification-item">
						<div className="notification-content">
							<div className="notification-title">{notification.title}</div>
							<div className="notification-description">
								{notification.description}
							</div>
							<div className="notification-time">{notification.time}</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
