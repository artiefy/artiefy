'use client';

import { type Dispatch, type SetStateAction, useRef } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { ArtieIdeaComposer } from '~/components/estudiantes/proyectos/home/ArtieIdeaComposer';
import { IdeaSuggestions } from '~/components/estudiantes/proyectos/home/IdeaSuggestions';

import type { ProjectAiSeed } from '~/components/projects/Modals/ProjectModeChooser';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface LandingHeroProps {
  idea: string;
  onIdeaChange: Dispatch<SetStateAction<string>>;
  onSubmit: (seed: ProjectAiSeed) => void;
}

/**
 * Landing section 1: the promise and the same idea composer as `/proyectos`,
 * so a visitor can start a project from the first screen.
 */
export function LandingHero({
  idea,
  onIdeaChange,
  onSubmit,
}: LandingHeroProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          full: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { reduced } = context.conditions as { reduced: boolean };
          // Each piece arrives from its own side; reduced motion keeps only
          // the fade so the order still reads without anything sliding.
          const from = (vars: gsap.TweenVars): gsap.TweenVars =>
            reduced ? { autoAlpha: 0 } : { ...vars, autoAlpha: 0 };

          gsap
            .timeline({ defaults: { duration: 0.9, ease: 'power3.out' } })
            .from('[data-hero="line-start"]', from({ x: -90 }))
            .from('[data-hero="line-end"]', from({ x: 90 }), '<0.2')
            .from('[data-hero="lead"]', from({ y: 28 }), '<0.25')
            .from(
              '[data-hero="composer"]',
              from({ y: 40, scale: 0.96 }),
              '<0.2'
            );

          if (reduced) return;

          // Leaving the hero, the copy drifts up and dims while the 3D camera
          // flies forward behind it.
          gsap.to('[data-hero="content"]', {
            yPercent: -10,
            autoAlpha: 0.25,
            ease: 'none',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        }
      );

      return () => mm.revert();
    },
    { scope }
  );

  const applySuggestion = (suggestion: string) => {
    onIdeaChange(suggestion);
    scope.current
      ?.querySelector<HTMLInputElement>(
        '[data-hero="composer"] input:not([type="file"])'
      )
      ?.focus();
  };

  return (
    <section
      ref={scope}
      aria-labelledby="landing-hero-title"
      className="
        relative flex min-h-dvh items-center overflow-hidden
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute top-1/4 left-1/4 size-[600px]
          rounded-full bg-cyan-500/10 blur-[150px]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute right-1/4 bottom-1/4 size-[500px]
          rounded-full bg-teal-500/8 blur-[120px]
        "
      />
      {/* Calms the 3D network right behind the copy so the lines never cut
          through the text, while it stays vivid around the edges. */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_45%_50%_at_50%_50%,rgb(1_20_43/0.75),transparent_75%)]
        "
      />

      {/* The header floats over the hero, so the top padding clears it. */}
      <div className="relative z-10 container mx-auto px-4 pt-32 pb-16 sm:pt-36 sm:pb-20">
        <div data-hero="content" className="mx-auto max-w-4xl text-center">
          <h1
            id="landing-hero-title"
            className="
              mb-6 text-3xl leading-tight font-bold text-foreground
              md:text-4xl
              lg:text-5xl
              xl:text-6xl
            "
          >
            <span data-hero="line-start" className="block">
              Construye tu{' '}
              <span className="relative inline-block whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none absolute -inset-x-3 -inset-y-2
                    bg-[radial-gradient(ellipse_at_center,hsl(185_85%_55%/0.3),transparent_70%)]
                  "
                />
                <span
                  className="
                    text-shimmer relative
                    bg-[linear-gradient(100deg,var(--color-primary),hsl(185_95%_76%),var(--color-primary))]
                    bg-clip-text text-transparent
                    drop-shadow-[0_0_20px_hsl(185_72%_48%/0.55)]
                  "
                >
                  idea
                </span>
              </span>
            </span>{' '}
            <span
              data-hero="line-end"
              className="
                block bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400
                bg-clip-text pb-1 text-transparent
                drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]
              "
            >
              {/* Same break as the design from tablets up; phones wrap freely. */}
              y consigue tus primeros
              <br className="max-md:hidden" /> clientes
            </span>
          </h1>

          <p
            data-hero="lead"
            className="
              mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400
              md:text-xl
            "
          >
            Artie, tu guía con IA, te lleva paso a paso hasta un proyecto
            probado con gente real.
          </p>

          <div
            data-hero="composer"
            className="landing-idea-composer mx-auto mb-8 max-w-2xl"
          >
            <ArtieIdeaComposer
              size="lg"
              placeholder="Cuéntale tu idea a Artie…"
              idea={idea}
              onIdeaChange={onIdeaChange}
              onSubmit={onSubmit}
            />
          </div>

          {/* Wider than the copy on large screens so the three fit on one row. */}
          <IdeaSuggestions
            label="Prueba:"
            onPick={applySuggestion}
            className="xl:-mx-32"
          />
        </div>
      </div>
    </section>
  );
}
