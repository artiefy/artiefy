'use client';
import { useEffect, useState } from 'react';

import { LuInfo } from 'react-icons/lu';

import { useExtras } from '~/app/estudiantes/StudentContext';

import '~/styles/tourButtonAnimations.css';

export const TourComponent = () => {
  const { showExtras } = useExtras();
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > 768
  );
  const [hideButton, setHideButton] = useState(false); // ← visible por defecto
  const [showAnim, setShowAnim] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const ANIMATION_DURATION = 350;

  useEffect(() => {
    // Solo se ejecuta en el cliente: actualizar on resize (no establecer sincronamente)
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lógica de animación/desmontaje igual que soporte
  useEffect(() => {
    if (showExtras && !hideButton) {
      // Evitar setState síncrono dentro del effect: hacerlo asíncrono para evitar cascada de renders
      const t = setTimeout(() => {
        setShowAnim(true);
        setIsExiting(false);
      }, 0);
      return () => clearTimeout(t);
    } else if (showAnim) {
      const t = setTimeout(() => setIsExiting(true), 0);
      const timeout = setTimeout(() => {
        setShowAnim(false);
        setIsExiting(false);
      }, ANIMATION_DURATION);
      return () => {
        clearTimeout(t);
        clearTimeout(timeout);
      };
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

  // Mostrar siempre en móvil, solo icono; en desktop, botón completo

  return (
    <>
      {!hideButton && (isDesktop ? showAnim : true) && (
        <div
          className={`fixed z-10 translate-x-0 ${isDesktop ? 'right-24 bottom-9' : 'right-24 bottom-9.5'}`}
          onMouseEnter={() =>
            window.dispatchEvent(new Event('extras-hover-enter'))
          }
          onMouseLeave={() =>
            window.dispatchEvent(new Event('extras-hover-leave'))
          }
          style={{
            animationName: isExiting ? 'fadeOutRight' : 'fadeInRight',
            animationDuration: `${ANIMATION_DURATION}ms`,
            animationTimingFunction: 'ease',
            animationFillMode: 'forwards',
          }}
        >
          <button
            onClick={() => {
              console.log('Botón de tour clickeado');
              window.dispatchEvent(new Event('start-tour'));
            }}
            className={`relative flex items-center justify-center rounded-full border border-green-400 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:from-emerald-500 hover:to-green-600 hover:shadow-[0_0_20px_#00c951] ${isDesktop ? 'gap-2 px-2.5 py-2.5 sm:text-sm' : 'h-12 w-12 p-0'}`}
            aria-label="Tour por la Aplicación"
          >
            <LuInfo
              className={`text-xl text-white opacity-90 ${isDesktop ? '' : 'text-2xl'}`}
            />
            {isDesktop && (
              <>
                <span className="hidden font-medium tracking-wide sm:inline">
                  Tour por la Aplicación
                </span>
                {/* Triángulo tipo burbuja */}
                <span className="absolute bottom-[14px] left-1/2 hidden h-0 w-0 translate-x-31 rotate-[270deg] transform border-t-[8px] border-r-[6px] border-l-[6px] border-t-green-500 border-r-transparent border-l-transparent sm:inline" />
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};
