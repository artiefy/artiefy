'use client';
import { useExtras } from '~/app/estudiantes/StudentContext';
import React, { useEffect, useState } from 'react';
import { ImEnter } from "react-icons/im";


export const TourComponent = () => {
	const { showExtras } = useExtras();
	const [isDesktop, setIsDesktop] = useState(false);
	const [hideButton, setHideButton] = useState(false); // ← visible por defecto

	useEffect(() => {
	// Solo se ejecuta en el cliente
	setIsDesktop(window.innerWidth > 768);

	// Si quieres que se actualice al redimensionar:
	const handleResize = () => setIsDesktop(window.innerWidth > 768);
	window.addEventListener('resize', handleResize);
	return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		const handleHideButton = () => setHideButton(true);  // Oculta al abrir chat
		const handleShowButton = () => setHideButton(false); // Muestra al cerrar chat

		window.addEventListener('student-chat-open', handleHideButton);
		window.addEventListener('student-chat-close', handleShowButton);

		return () => {
			window.removeEventListener('student-chat-open', handleHideButton);
			window.removeEventListener('student-chat-close', handleShowButton);
		};
	}, []);

	if (!showExtras && isDesktop) return null; // Solo se muestra si showExtras es true

	return (
		<>
			{!hideButton && (
				<div className="fixed bottom-10 sm:bottom-25 right-35 sm:right-40 translate-x-1/2 sm:translate-x-0 z-10">
				<button
					onClick={() => window.dispatchEvent(new Event('start-tour'))}
					className="relative px-5 py-2 rounded-full border border-green-400 text-white bg-gradient-to-r from-green-500 to-emerald-600 
					hover:from-emerald-500 hover:to-green-600 transition-all duration-300 ease-in-out 
					shadow-md hover:shadow-[0_0_20px_#00c951] hover:scale-105 flex items-center gap-2"
				>
					<ImEnter className="text-xl text-white opacity-90" />
					<span className="hidden sm:inline font-medium tracking-wide">Tour por la Aplicación</span>

					{/* Triángulo tipo burbuja */}
					<span className="absolute bottom-[13px] left-1/2 transform translate-x-31 rotate-[270deg] w-0 h-0 
					border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-green-500 hidden sm:inline" />
				</button>
				</div>




			)}
		</>
	);
};
