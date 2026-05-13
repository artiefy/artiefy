'use client';
import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import { LuInfo } from 'react-icons/lu';

import { useExtras } from '~/app/estudiantes/StudentContext';

import '~/styles/tourButtonAnimations.css';

export const TourComponent = () => {
  const { showExtras } = useExtras();
  const [isMounted, setIsMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileBottomCtaVisible, setIsMobileBottomCtaVisible] =
    useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const ANIMATION_DURATION = 350;
  const pathname = usePathname();
  const isClassRoute = pathname?.startsWith('/estudiantes/clases/') ?? false;
  const hideButton = isChatOpen || isProjectModalOpen;

  useEffect(() => {
    setIsMounted(true);
    setIsDesktop(window.innerWidth > 768);
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const syncMobileBottomCta = () => {
      setIsMobileBottomCtaVisible(
        document.documentElement.dataset.mobileBottomCtaVisible === 'true'
      );
    };
    const handleMobileBottomCtaChange = (
      event: Event | CustomEvent<{ visible?: boolean }>
    ) => {
      if ('detail' in event && typeof event.detail?.visible === 'boolean') {
        setIsMobileBottomCtaVisible(event.detail.visible);
        return;
      }
      syncMobileBottomCta();
    };

    syncMobileBottomCta();
    window.addEventListener(
      'mobile-bottom-cta-visibility-change',
      handleMobileBottomCtaChange
    );

    return () => {
      window.removeEventListener(
        'mobile-bottom-cta-visibility-change',
        handleMobileBottomCtaChange
      );
    };
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
    const handleHideButton = () => setIsChatOpen(true);
    const handleShowButton = () => setIsChatOpen(false);
    window.addEventListener('student-chat-open', handleHideButton);
    window.addEventListener('student-chat-close', handleShowButton);
    return () => {
      window.removeEventListener('student-chat-open', handleHideButton);
      window.removeEventListener('student-chat-close', handleShowButton);
    };
  }, []);

  useEffect(() => {
    const handleProjectModalOpen = () => setIsProjectModalOpen(true);
    const handleProjectModalClose = () => setIsProjectModalOpen(false);
    window.addEventListener('project-modal-open', handleProjectModalOpen);
    window.addEventListener('project-modal-close', handleProjectModalClose);
    return () => {
      window.removeEventListener('project-modal-open', handleProjectModalOpen);
      window.removeEventListener(
        'project-modal-close',
        handleProjectModalClose
      );
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

  if (!isMounted) return null;

  const floatingBottomClass = isMobileBottomCtaVisible
    ? 'bottom-22'
    : 'bottom-9';

  return (
    <>
      {!hideButton && (isDesktop ? showAnim : true) && (
        <div
          className={`
            fixed z-50 translate-x-0
            ${
              isClassRoute
                ? `
                  left-24
                  ${floatingBottomClass}
                `
                : `
                  right-22
                  ${floatingBottomClass}
                `
            }
          `}
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
            className={`
              relative flex items-center justify-center rounded-full border
              border-green-400 bg-gradient-to-r from-green-500 to-emerald-600
              text-white shadow-md transition-all duration-300 ease-in-out
              hover:scale-105 hover:from-emerald-500 hover:to-green-600
              hover:shadow-[0_0_20px_#00c951]
              ${
                isDesktop
                  ? `
                    gap-2 p-2.5
                    sm:text-sm
                  `
                  : 'size-12 p-0'
              }
            `}
            aria-label="Tour por la Aplicación"
          >
            <LuInfo
              className={`
                text-xl text-white opacity-90
                ${isDesktop ? '' : 'text-2xl'}
              `}
            />
            {isDesktop && (
              <>
                <span
                  className="
                    hidden font-medium tracking-wide
                    sm:inline
                  "
                >
                  Tour por la Aplicación
                </span>
                {/* Triángulo tipo burbuja. Si el botón está en la izquierda, mostrar triángulo apuntando a la derecha */}
                <span
                  className={`
                    absolute bottom-[14px] hidden size-0
                    sm:inline
                    ${isClassRoute ? 'right-1/2 translate-x-1 rotate-90' : 'left-1/2 -translate-x-1 rotate-[270deg]'} transform border-x-[6px] border-t-[8px]`}
                  style={{
                    borderTopColor: '#10b981',
                    borderRightColor: isClassRoute
                      ? 'transparent'
                      : 'transparent',
                    borderLeftColor: isClassRoute
                      ? 'transparent'
                      : 'transparent',
                  }}
                />
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
};
