'use client';

import React, { useEffect, useState } from 'react';
import { ImEnter } from "react-icons/im";

export const TourComponent = () => {
	const [hideButton, setHideButton] = useState(false); // ← visible por defecto

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

	return (
		<>
			{!hideButton && (
				<div className="fixed bottom-10 sm:bottom-20 right-35 sm:right-32 translate-x-1/2 sm:translate-x-0 z-10">

					<button
						onClick={() => {
							window.dispatchEvent(new Event('start-tour'));
						}}
						className="relative bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg hover:bg-green-600 hover:scale-105 transition-all duration-300"
					>
						<ImEnter className="text-xl" />
						<span className="hidden sm:inline font-medium">Tour por la Aplicación</span>

						{/* Triángulo tipo burbuja */}
						<span className="absolute bottom-[8px] left-1/2 transform translate-x-28 rotate-[60deg] w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-green-500 hidden sm:inline" />
					</button>
				</div>
			)}
		</>
	);
};
