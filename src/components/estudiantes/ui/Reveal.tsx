'use client';

import { useRef, type ReactNode } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Distancia vertical (px) desde la que entra el elemento. */
  y?: number;
  /** Duración del tween (s). */
  duration?: number;
  /** Retraso inicial (s). */
  delay?: number;
  /**
   * Cascada entre los hijos directos (s). Si es > 0, anima los hijos del
   * contenedor (ideal para grids/listas). Si es 0, anima el elemento completo.
   */
  stagger?: number;
  /** Posición de inicio de ScrollTrigger (formato "trigger viewport"). */
  start?: string;
}

/**
 * Revela su contenido con un fade + slide-up al entrar en el viewport.
 *
 * - Sirve para entrada al cargar (si ya está sobre el pliegue, dispara solo)
 *   y para aparición al scrollear (dispara cuando entra).
 * - SSR-safe: la animación corre solo en cliente vía useGSAP (useLayoutEffect),
 *   así no hay parpadeo (FOUC) porque el estado inicial se aplica antes del paint.
 * - Respeta prefers-reduced-motion: si el usuario pide menos movimiento, el
 *   contenido se muestra sin animación.
 * - La limpieza (revert de tweens y ScrollTriggers) es automática al desmontar.
 */
export function Reveal({
  children,
  className,
  y = 28,
  duration = 0.7,
  delay = 0,
  stagger = 0,
  start = 'top 85%',
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const targets =
          stagger > 0 ? Array.from(root.children) : (root as Element);

        gsap.from(targets, {
          opacity: 0,
          y,
          duration,
          delay,
          stagger,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: root,
            start,
            once: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
