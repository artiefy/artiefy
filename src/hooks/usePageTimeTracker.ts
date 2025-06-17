'use client';

import { useEffect, useRef,useState } from 'react';

const usePageTimeTracker = (userId: string | null, courseId: number | null) => {
	const [isInactivePopupOpen, setIsInactivePopupOpen] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [isPopupActive, setIsPopupActive] = useState(false); // Nuevo estado para evitar el reinicio automático
	const intervalRef = useRef<NodeJS.Timeout | null>(null); // ⬅ Agregar esta línea antes
	const isSending = useRef(false);

	useEffect(() => {
		if (!userId) return;

		let timeout: NodeJS.Timeout;

		const resetTimer = () => {
			if (isPopupActive) return; // ❌ Evita que el temporizador se resetee si el popup está abierto

			setIsInactivePopupOpen(false);
			setIsPaused(false);
			clearTimeout(timeout);
			timeout = setTimeout(
				() => {
					console.log('⏳ Usuario inactivo, mostrando popup...');
					setIsInactivePopupOpen(true);
					setIsPaused(true);
					setIsPopupActive(true); // ✅ Marcar el popup como activo
				},
				5 * 60 * 1000
			); // 10 segundos sin interacción
		};

		const sendTime = async () => {
			if (isPaused || isSending.current) return;

			const entryTime = parseInt(localStorage.getItem('entryTime') ?? '0', 10);
			const now = Date.now();
			const elapsedMinutes = Math.floor((now - entryTime) / 60000);
			isSending.current = true;

			if (elapsedMinutes > 0) {
				try {
					const response = await fetch('/api/super-admin/user-time', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ userId, courseId, elapsedMinutes }),
					});

					if (!response.ok) {
						console.error(
							'❌ Error al registrar el tiempo:',
							await response.text()
						);
					} else {
						localStorage.setItem('entryTime', Date.now().toString());
					}
				} catch (error) {
					console.error('❌ Error al enviar tiempo al backend:', error);
				}
			}
			isSending.current = false;
		};

		localStorage.setItem('entryTime', Date.now().toString());

		document.addEventListener('mousemove', resetTimer);
		document.addEventListener('keydown', resetTimer);
		document.addEventListener('click', resetTimer);

		intervalRef.current = setInterval(sendTime, 60000);

		resetTimer();

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}

			clearTimeout(timeout);
			document.removeEventListener('mousemove', resetTimer);
			document.removeEventListener('keydown', resetTimer);
			document.removeEventListener('click', resetTimer);
		};
	}, [userId, courseId, isPaused, isPopupActive]);

	// ✅ Nueva función para cerrar el popup y reanudar el seguimiento
	const handleContinue = () => {
		console.log('✅ Usuario quiere continuar, reanudando seguimiento...');
		setIsInactivePopupOpen(false);
		setIsPaused(false);
		setIsPopupActive(false);
	};

	return { isInactivePopupOpen, handleContinue };
};

export default usePageTimeTracker;
