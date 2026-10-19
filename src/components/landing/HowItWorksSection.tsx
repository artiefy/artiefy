'use client';

import { useRef } from 'react';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code, GraduationCap, Rocket } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STEPS = [
  {
    icon: GraduationCap,
    title: 'Aprende con propósito',
    description:
      'Cursos diseñados alrededor de proyectos reales. Cada lección te acerca a un producto terminado.',
  },
  {
    icon: Code,
    title: 'Construye con IA',
    description:
      'Herramientas de IA que te ayudan a planear, ejecutar y documentar tu proyecto paso a paso.',
  },
  {
    icon: Rocket,
    title: 'Lanza y comparte',
    description:
      'Publica tu proyecto, recibe feedback de la comunidad y conecta con oportunidades reales.',
  },
] as const;

/** Where each step enters from when the three sit side by side. */
const WIDE_ENTRANCES: gsap.TweenVars[] = [{ x: -140 }, { y: 120 }, { x: 140 }];

const REVEAL = {
  start: 'top 82%',
  toggleActions: 'play none none reverse',
} as const;

/**
 * Landing section 2: the three steps from idea to product. Each block
 * appears as it scrolls in, one at a time and from a different side.
 */
export function HowItWorksSection() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          wide: '(min-width: 1024px)',
          narrow: '(max-width: 1023px)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { wide, reduced } = context.conditions as {
            wide: boolean;
            reduced: boolean;
          };
          // Reduced motion keeps the one-by-one order as plain fades.
          const from = (vars: gsap.TweenVars): gsap.TweenVars =>
            reduced ? { autoAlpha: 0 } : { ...vars, autoAlpha: 0 };

          gsap
            .timeline({
              defaults: { duration: 0.8, ease: 'power3.out' },
              scrollTrigger: { trigger: '[data-how="intro"]', ...REVEAL },
            })
            .from('[data-how="badge"]', from({ y: -30 }))
            .from('[data-how="title"]', from({ x: -90 }), '<0.15')
            .from('[data-how="lead"]', from({ x: 90 }), '<0.15');

          const steps = gsap.utils.toArray<HTMLElement>('[data-how="step"]');

          if (wide) {
            // Side by side they scroll in together, so a timeline keeps them
            // arriving in order instead of all at once.
            const timeline = gsap.timeline({
              defaults: { duration: 0.85, ease: 'power3.out' },
              scrollTrigger: { trigger: '[data-how="steps"]', ...REVEAL },
            });
            steps.forEach((step, index) => {
              timeline.from(
                step,
                from(WIDE_ENTRANCES[index % WIDE_ENTRANCES.length]!),
                index === 0 ? 0 : '<0.3'
              );
            });
            return;
          }

          // Stacked, each step enters on its own as it scrolls in, alternating
          // sides.
          steps.forEach((step, index) => {
            gsap.from(step, {
              ...from({ x: index % 2 === 0 ? -80 : 80 }),
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: { trigger: step, ...REVEAL },
            });
          });
        }
      );

      return () => mm.revert();
    },
    { scope }
  );

  return (
    <section
      ref={scope}
      id="como-funciona"
      aria-labelledby="how-it-works-title"
      className="
        relative flex min-h-dvh flex-col justify-center overflow-x-clip py-24
        sm:py-32
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 bg-gradient-to-b
          from-transparent via-cyan-500/5 to-transparent
        "
      />

      <div className="relative container mx-auto px-4">
        <div
          data-how="intro"
          className="mx-auto mb-14 max-w-2xl text-center sm:mb-16"
        >
          <p
            data-how="badge"
            className="
              mb-5 inline-flex rounded-full border border-primary/30
              bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary
            "
          >
            Cómo funciona
          </p>
          <h2
            id="how-it-works-title"
            data-how="title"
            className="
              mb-4 text-3xl font-bold tracking-tight text-balance
              text-foreground
              sm:text-4xl
              lg:text-5xl
            "
          >
            De la idea al producto en 3 pasos
          </h2>
          <p data-how="lead" className="text-lg leading-relaxed text-slate-400">
            No solo aprendes teoría. Construyes proyectos reales que puedes
            mostrar.
          </p>
        </div>

        <ol
          data-how="steps"
          className="
            mx-auto grid max-w-xl gap-6
            lg:max-w-none lg:grid-cols-3 lg:gap-8
          "
        >
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li
              key={title}
              data-how="step"
              className="
                group relative overflow-hidden rounded-2xl border
                border-white/10 bg-surface-deep/80 p-8 backdrop-blur-sm
                transition-colors duration-300
                hover:border-primary/40
              "
            >
              <span
                aria-hidden="true"
                className="
                  absolute top-6 right-8 text-6xl leading-none font-bold
                  text-white/5 tabular-nums transition-colors duration-300
                  group-hover:text-primary/15
                "
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                aria-hidden="true"
                className="
                  mb-8 flex size-14 items-center justify-center rounded-xl
                  bg-primary/15 text-primary ring-1 ring-primary/25 ring-inset
                "
              >
                <Icon className="size-7" />
              </span>
              <h3 className="mb-3 text-xl font-bold text-foreground">
                {title}
              </h3>
              <p className="leading-relaxed text-slate-400">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
