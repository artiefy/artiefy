import { FaQuoteLeft, FaStar } from 'react-icons/fa';

import { RevealStagger } from '~/components/estudiantes/ui/RevealStagger';

import { testimonials } from './data';

export function Testimonials() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <span className="text-sm font-semibold tracking-widest text-primary uppercase">
          Historias reales
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Lo que dicen nuestros estudiantes
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          Miles de personas ya transformaron su carrera con Artiefy. Estas son
          algunas de sus voces.
        </p>
      </div>

      <RevealStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="group relative flex flex-col gap-5 rounded-2xl border border-white/10 bg-slate-900/70 p-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-slate-900/85"
          >
            <FaQuoteLeft className="size-7 text-primary/40 transition-colors group-hover:text-primary/70" />

            <blockquote className="grow leading-relaxed text-slate-200">
              “{t.quote}”
            </blockquote>

            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: t.rating }).map((_, i) => (
                <FaStar key={i} className="size-4" />
              ))}
            </div>

            <figcaption className="flex items-center gap-3 border-t border-white/10 pt-5">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.accent} text-sm font-bold text-white`}
              >
                {t.initials}
              </span>
              <span className="flex flex-col">
                <span className="font-semibold text-white">{t.name}</span>
                <span className="text-sm text-slate-400">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </RevealStagger>
    </section>
  );
}
