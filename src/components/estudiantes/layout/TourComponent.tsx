'use client';
import React, { useEffect, useState } from 'react';

import { LuInfo } from "react-icons/lu";

import { useExtras } from '~/app/estudiantes/StudentContext';
import '~/styles/tourButtonAnimations.css';


export const TourComponent = () => {
	const { showExtras } = useExtras();
	const [isDesktop, setIsDesktop] = useState(false);
const [hideButton, setHideButton] = useState(false); // ← visible por defecto
const [showAnim, setShowAnim] = useState(false);
const [isExiting, setIsExiting] = useState(false);
const ANIMATION_DURATION = 350;

	useEffect(() => {
	// Solo se ejecuta en el cliente
	setIsDesktop(window.innerWidth > 768);

	// Si quieres que se actualice al redimensionar:
	const handleResize = () => setIsDesktop(window.innerWidth > 768);
	window.addEventListener('resize', handleResize);
	return () => window.removeEventListener('resize', handleResize);
	}, []);


	// Lógica de animación/desmontaje igual que soporte
	useEffect(() => {
		if (showExtras && !hideButton) {
			setShowAnim(true);
			setIsExiting(false);
		} else if (showAnim) {
			setIsExiting(true);
			const timeout = setTimeout(() => {
				setShowAnim(false);
				setIsExiting(false);
			}, ANIMATION_DURATION);
			return () => clearTimeout(timeout);
		}
	}, [showExtras, hideButton, showAnim]);

	// Oculta al abrir chat, muestra al cerrar chat
	useEffect(() => {
		const handleHideButton = () => setHideButton(true);
		const handleShowButton = () => setHideButton(false);
		window.addEventListener('student-chat-open', handleHideButton);
		window.addEventListener('student-chat-close', handleShowButton);
		return () => {
			window.removeEventListener('student-chat-open', handleHideButton);
			window.removeEventListener('student-chat-close', handleShowButton);
		};
	}, []);

	// Desaparece automáticamente a los 5s
	useEffect(() => {
		if (showExtras && !hideButton) {
			const timeout = setTimeout(() => {
				setIsExiting(true);
				setTimeout(() => {
					setShowAnim(false);
					setIsExiting(false);
				}, ANIMATION_DURATION);
			}, 6300); // Ahora el tour desaparece después del ticket
			return () => clearTimeout(timeout);
		}
	}, [showExtras, hideButton]);

	// if (!isDesktop) return null;

	return (
		<>
			{(showAnim || !isDesktop) && (
				<div
					className="fixed bottom-10 sm:bottom-25 right-35 sm:right-40 translate-x-1/2 sm:translate-x-0 z-10"
					style={{
						animationName: isExiting ? 'fadeOutRight' : 'fadeInRight',
						animationDuration: `${ANIMATION_DURATION}ms`,
						animationTimingFunction: 'ease',
						animationFillMode: 'forwards',
					}}
				>
					<button
						onClick={() => window.dispatchEvent(new Event('start-tour'))}
						className="relative px-5 py-2 rounded-full border border-green-400 text-white bg-gradient-to-r from-green-500 to-emerald-600 
						hover:from-emerald-500 hover:to-green-600 transition-all duration-300 ease-in-out 
						shadow-md hover:shadow-[0_0_20px_#00c951] hover:scale-105 flex items-center gap-2"
					>
						<LuInfo className="text-xl text-white opacity-90" />
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
