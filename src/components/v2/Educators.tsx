'use client';

import { FaBookOpen, FaUsers } from 'react-icons/fa';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/estudiantes/ui/carousel';

import { educators } from './data';

export function Educators() {
  return (
    <section className="relative z-10 w-full overflow-hidden py-24">
      <div className="mx-auto mb-14 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <span className="text-sm font-semibold tracking-widest text-primary uppercase">
          Aprende de los mejores
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Conoce a nuestros educadores
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          Profesionales en activo que combinan experiencia real con la pasión
          por enseñar.
        </p>
      </div>

      <Carousel
        opts={{ align: 'start', loop: true }}
        className="group/carousel mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <CarouselContent className="-ml-4">
          {educators.map((edu) => (
            <CarouselItem
              key={edu.name}
              className="pl-4 sm:basis-1/2 lg:basis-1/3"
            >
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
                {/* Gradient banner with overlapping avatar */}
                <div className={`relative h-24 bg-gradient-to-r ${edu.accent}`}>
                  <span className="absolute -bottom-8 left-6 flex size-16 items-center justify-center rounded-2xl border-4 border-slate-900 bg-slate-800 text-lg font-bold text-white shadow-lg">
                    {edu.initials}
                  </span>
                </div>

                <div className="flex grow flex-col gap-4 p-6 pt-12">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {edu.name}
                    </h3>
                    <p className="text-sm font-medium text-primary">
                      {edu.specialty}
                    </p>
                  </div>

                  <p className="grow text-sm leading-relaxed text-slate-400">
                    {edu.bio}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {edu.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-5 border-t border-white/10 pt-4 text-sm text-slate-400">
                    <span className="flex items-center gap-2">
                      <FaBookOpen className="size-4 text-primary" />
                      {edu.courses} cursos
                    </span>
                    <span className="flex items-center gap-2">
                      <FaUsers className="size-4 text-primary" />
                      {edu.students} estudiantes
                    </span>
                  </div>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="border-white/20 bg-slate-900/80 text-white hover:bg-primary hover:text-primary-foreground" />
        <CarouselNext className="border-white/20 bg-slate-900/80 text-white hover:bg-primary hover:text-primary-foreground" />
      </Carousel>
    </section>
  );
}
