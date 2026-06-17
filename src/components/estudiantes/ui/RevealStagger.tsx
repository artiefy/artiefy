'use client';

import { useRef, type ReactNode } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface RevealStaggerProps {
  children: ReactNode;
  className?: string;
  /** Distancia vertical (px) desde la que entra cada hijo. */
  y?: number;
  /** Duración del tween por hijo (s). */
  duration?: number;
  /** Cascada entre hijos que entran juntos (s). */
  stagger?: number;
  /** Posición de inicio de ScrollTrigger (formato "trigger viewport"). */
  start?: string;
}

/**
 * Revela los HIJOS DIRECTOS en cascada a medida que ENTRAN al viewport,
 * usando ScrollTrigger.batch() (la forma recomendada para grillas/listas:
 * cada fila aparece cuando entra, no todo el bloque de golpe).
 *
 * - SSR-safe: corre solo en cliente vía useGSAP (sin parpadeo/FOUC).
 * - Respeta prefers-reduced-motion: sin animación si el usuario lo pide.
 * - Usa clearProps al terminar para no dejar transforms inline que rompan
 *   los hovers/animaciones propias de las cards.
 * - Limpieza automática de tweens y ScrollTriggers al desmontar.
 */
export function RevealStagger({
  children,
  className,
  y = 24,
  duration = 0.6,
  stagger = 0.08,
  start = 'top 88%',
}: RevealStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const items = gsap.utils.toArray<HTMLElement>(root.children);
      if (items.length === 0) return;

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(items, { opacity: 0, y });

        const triggers = ScrollTrigger.batch(items, {
          start,
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration,
              stagger,
              ease: 'power2.out',
              overwrite: true,
              clearProps: 'transform,opacity',
            }),
        });

        return () => triggers.forEach((t) => t.kill());
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
