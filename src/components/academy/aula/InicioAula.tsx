'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { CalendarDays, Layers } from 'lucide-react';
import { FaStar } from 'react-icons/fa';
import { FaArrowTrendUp } from 'react-icons/fa6';
import { GrOverview } from 'react-icons/gr';
import { HiLibrary } from 'react-icons/hi';
import { IoLibrarySharp } from 'react-icons/io5';

import StudentGradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/estudiantes/ui/carousel';
import { RevealStagger } from '~/components/estudiantes/ui/RevealStagger';
import { blurDataURL } from '~/lib/blurDataUrl';
import { normalizeSearch } from '~/lib/utils';
import { type InicioEstudiante } from '~/server/academy/aula';

import type { Route } from 'next';

// Inicio del estudiante de una academia: el mismo /estudiantes de Artiefy
// (StudentDetails + MyCoursesPreview + StudentListCourses) con los cursos de
// la academia y los colores de su tema. Mismo hero con título en degradado y
// buscador con brillo, chips de filtro, "Seguir viendo", "Top Cursos" y la
// grilla de cursos con la tarjeta de "Cursos Artie".

// Degradado del título: el color principal de la academia.
const DEGRADADO = [
  'var(--ac-primario)',
  'color-mix(in srgb, var(--ac-primario) 55%, white)',
  'var(--ac-primario)',
];

const imagen = (key: string | null) =>
  key
    ? `/api/image-proxy?url=${encodeURIComponent(
        `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${key}`
      )}`
    : 'https://placehold.co/600x400/01142B/3AF4EF?text=Curso&font=MONTSERRAT';

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

const urlCurso = (id: number) => `/dashboard/student/cursos/${id}` as Route;

export function InicioAula({
  nombre,
  datos,
}: {
  nombre: string;
  datos: InicioEstudiante;
}) {
  const { misCursos, todos } = datos;
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<string>('todos');

  const categorias = useMemo(
    () =>
      [
        ...new Set(
          todos.map((c) => c.categoryName).filter((c): c is string => !!c)
        ),
      ].sort(),
    [todos]
  );
  const filtros = [
    { key: 'todos', label: 'Todos', icon: Layers },
    { key: 'mios', label: 'Mis cursos', icon: IoLibrarySharp },
    ...categorias.map((c) => ({ key: `cat:${c}`, label: c, icon: HiLibrary })),
  ];

  const q = normalizeSearch(busqueda.trim());
  const visibles = todos.filter(
    (c) =>
      (!q ||
        normalizeSearch(
          `${c.title} ${c.categoryName ?? ''} ${c.instructorName ?? ''}`
        ).includes(q)) &&
      (filtro === 'todos' ||
        (filtro === 'mios' && c.matriculado) ||
        (filtro.startsWith('cat:') && c.categoryName === filtro.slice(4)))
  );
  const inicio = filtro === 'todos' && !q;
  const top = [...todos]
    .sort((a, b) => b.rating - a.rating || (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 10);

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden pb-16">
      <main className="w-full max-w-full grow overflow-x-hidden">
        <div className="flex flex-col space-y-12 sm:space-y-16">
          {/* Hero */}
          <div className="mt-16 flex animate-zoom-in flex-col items-center space-y-4 px-2 sm:mt-8 sm:px-0 lg:mt-24">
            <div className="relative flex w-full flex-col items-center justify-center gap-4">
              <div className="pointer-events-none absolute -top-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
              <div className="relative flex flex-col items-center text-center">
                <StudentGradientText
                  colors={DEGRADADO}
                  className="text-3xl sm:text-5xl"
                >
                  Hola, {nombre}
                </StudentGradientText>
                <p className="mt-2 px-4 text-sm text-muted-foreground sm:mt-3 sm:px-0 sm:text-lg">
                  Encuentra tu próximo curso y continúa donde lo dejaste.
                </p>
              </div>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative flex w-full flex-col items-center space-y-2 px-4"
            >
              <div className="relative w-full max-w-[700px]">
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="¿Qué quieres aprender hoy?"
                  aria-label="Buscar cursos"
                  className="w-full rounded-xl border-[1.5px] border-border bg-card py-4 pr-12 pl-6 text-[13px] font-medium text-foreground shadow-[0_0_20px_color-mix(in_srgb,var(--ac-primario)_30%,transparent),0_0_40px_color-mix(in_srgb,var(--ac-primario)_10%,transparent)] transition-all duration-300 placeholder:text-muted-foreground focus:shadow-[0_0_25px_color-mix(in_srgb,var(--ac-primario)_50%,transparent),0_0_50px_color-mix(in_srgb,var(--ac-primario)_20%,transparent)] focus:outline-none"
                />
                <svg
                  viewBox="0 0 24 24"
                  className="absolute top-1/2 right-4 size-5 -translate-y-1/2 fill-primary"
                  aria-hidden="true"
                >
                  <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
                </svg>
              </div>
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Aprende a tu ritmo y{' '}
                <span className="font-medium text-primary">
                  sigue tu progreso
                </span>
              </p>
            </form>
          </div>

          {/* Chips de filtro */}
          <div className="relative animate-zoom-in">
            <div className="border-y border-border/30 py-4">
              <div className="flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-4 py-2 sm:px-24 [&::-webkit-scrollbar]:hidden">
                {filtros.map((f) => {
                  const Icono = f.icon;
                  const activo = filtro === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFiltro(f.key)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        activo
                          ? 'border-primary/30 bg-primary/15 text-primary shadow-sm shadow-primary/10'
                          : 'border-border/30 bg-card/50 text-muted-foreground hover:border-border/50 hover:bg-card hover:text-foreground'
                      }`}
                    >
                      <Icono className="size-4" />
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Seguir viendo */}
          {inicio && misCursos.length > 0 && (
            <section
              id="mis-cursos"
              className="-mt-12 mb-8 overflow-visible px-4 sm:px-24"
            >
              <div className="flex items-center justify-between pr-4 sm:pr-0">
                <div className="flex items-center gap-2">
                  <GrOverview className="text-xl text-foreground" />
                  <StudentGradientText
                    colors={DEGRADADO}
                    className="text-2xl sm:text-3xl"
                  >
                    Seguir viendo
                  </StudentGradientText>
                </div>
                <button
                  type="button"
                  onClick={() => setFiltro('mios')}
                  className="text-sm text-primary hover:underline"
                >
                  Ver Todos
                </button>
              </div>
              <div className="group/carousel relative z-20 overflow-visible">
                <Carousel opts={{ align: 'start', containScroll: 'trimSnaps' }}>
                  <CarouselContent className="gap-4 pt-3 pb-2">
                    {misCursos.slice(0, 8).map((c) => (
                      <CarouselItem
                        key={c.id}
                        className="basis-[280px] px-1 sm:basis-[320px] sm:px-2"
                      >
                        <Link
                          href={
                            c.continuar
                              ? (`/dashboard/student/cursos/${c.id}/clases/${c.continuar.id}` as Route)
                              : urlCurso(c.id)
                          }
                          className="group relative flex h-full transform-gpu flex-col overflow-hidden rounded-2xl bg-card transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform hover:-translate-y-2 hover:shadow-[0_18px_32px_-10px_rgba(0,0,0,0.65)]"
                        >
                          <div className="relative h-40 w-full overflow-hidden border-x border-t border-border bg-card">
                            <Image
                              src={imagen(c.coverImageKey)}
                              alt={c.title}
                              fill
                              unoptimized
                              className="size-full object-cover"
                              sizes="(max-width: 768px) 100vw, 420px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                            <div className="absolute top-3 right-3 rounded-2xl bg-primary px-3 py-1.5 text-[var(--ac-primario-texto)] shadow-lg">
                              <p className="mb-1 text-xs leading-tight font-semibold">
                                Continuar :
                              </p>
                              <p
                                className="max-w-[140px] truncate text-[10px] leading-tight opacity-90"
                                title={c.continuar?.title ?? 'Ir al curso'}
                              >
                                {c.continuar?.title ?? 'Ir al curso'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-1 flex-col border-x border-b border-border bg-card p-4">
                            <h2
                              className="mb-1 line-clamp-2 min-h-[38px] text-sm leading-snug font-semibold text-foreground"
                              title={c.title}
                            >
                              {c.title}
                            </h2>
                            <p className="mb-1 text-xs text-muted-foreground">
                              {c.categoryName ?? 'Sin categoria'}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-500"
                                  style={{ width: `${c.porcentaje}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">
                                {c.porcentaje}%
                              </span>
                            </div>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </section>
          )}

          {/* Top Cursos */}
          {inicio && top.length > 0 && (
            <div className="relative animate-zoom-in pr-0 pl-4 sm:px-24">
              <div className="mb-4 flex justify-start pr-4 sm:pr-0">
                <div className="flex items-center gap-2">
                  <FaArrowTrendUp className="text-xl text-foreground" />
                  <StudentGradientText
                    colors={DEGRADADO}
                    className="text-2xl sm:text-3xl"
                  >
                    Top Cursos
                  </StudentGradientText>
                </div>
              </div>
              <div className="group/carousel relative">
                <Carousel className="w-full">
                  <CarouselContent className="gap-x-2">
                    {top.map((c, i) => (
                      <CarouselItem
                        key={c.id}
                        className="basis-[85%] sm:basis-[60%] md:basis-1/3 lg:basis-[28%]"
                      >
                        <Link
                          href={urlCurso(c.id)}
                          className="group/card relative block overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <div className="relative h-56 w-full">
                            <Image
                              src={imagen(c.coverImageKey)}
                              alt={c.title}
                              fill
                              unoptimized
                              placeholder="blur"
                              blurDataURL={blurDataURL}
                              className="size-full rounded-2xl object-cover transition-transform duration-300 group-hover/card:scale-105"
                              sizes="(max-width: 768px) 100vw, 420px"
                            />
                            <div className="absolute top-3 left-3 flex size-8 items-center justify-center rounded-full bg-primary">
                              <span className="text-xs font-bold text-[var(--ac-primario-texto)]">
                                {i + 1}
                              </span>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0">
                              <div className="relative z-10 w-full rounded-b-2xl px-4 py-3">
                                <h2
                                  className="line-clamp-2 min-h-[1.8rem] text-[13px] leading-snug font-semibold text-white sm:text-[15px]"
                                  title={c.title}
                                >
                                  {c.title}
                                </h2>
                                <p className="mb-1 text-[13px] text-gray-200">
                                  {c.instructorName ?? 'Educador'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>
          )}

          {/* Cursos (grilla de "Cursos Artie") */}
          <div>
            <div className="mt-8 mb-3 flex px-8 lg:px-26">
              <div className="flex shrink-0 items-center gap-2">
                <HiLibrary className="text-xl text-foreground" />
                <StudentGradientText
                  colors={DEGRADADO}
                  className="text-2xl sm:text-3xl"
                >
                  {filtro === 'mios'
                    ? 'Mis cursos'
                    : filtro.startsWith('cat:')
                      ? filtro.slice(4)
                      : 'Cursos'}
                </StudentGradientText>
              </div>
            </div>
            {visibles.length === 0 ? (
              <p className="mx-8 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground lg:mx-26">
                {filtro === 'mios'
                  ? 'Aún no estás matriculado en ningún curso.'
                  : 'No hay cursos que coincidan.'}
              </p>
            ) : (
              <RevealStagger className="relative z-0 mb-8 grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-26">
                {visibles.map((c) => (
                  <div key={c.id} className="relative">
                    <Link
                      href={urlCurso(c.id)}
                      className="group block h-full rounded-2xl no-underline hover:no-underline focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <div className="relative isolate flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/50 bg-card text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--ac-primario)_15%,transparent)]">
                        <div className="relative h-40 overflow-hidden bg-card">
                          <Image
                            src={imagen(c.coverImageKey)}
                            alt={c.title}
                            fill
                            unoptimized
                            placeholder="blur"
                            blurDataURL={blurDataURL}
                            className="size-full transform-gpu object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
                          {c.matriculado && (
                            <span className="absolute top-3 right-3 z-10 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-[11px] font-semibold text-primary backdrop-blur-sm">
                              Matriculado
                            </span>
                          )}
                          {c.categoryName && (
                            <span className="absolute bottom-3 left-3 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-[11px] font-semibold text-primary backdrop-blur-sm">
                              {c.categoryName}
                            </span>
                          )}
                        </div>
                        <div className="relative z-10 -mt-px flex flex-1 flex-col gap-2 bg-card p-4">
                          <h2 className="line-clamp-2 text-base leading-snug font-bold text-foreground transition-colors duration-200 group-hover:text-primary">
                            {c.title}
                          </h2>
                          <p className="min-w-0 truncate text-xs text-muted-foreground">
                            Por{' '}
                            <span className="font-medium text-foreground/80">
                              {c.instructorName ?? 'Educador'}
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {c.modalidad && (
                              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                                {c.modalidad}
                              </span>
                            )}
                            {c.nivel && (
                              <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-0.5 text-[10px] font-medium text-foreground/90">
                                {c.nivel}
                              </span>
                            )}
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                            {c.proximaClase ? (
                              <span className="flex items-center gap-1">
                                <span className="relative mr-0.5 flex size-2 items-center justify-center">
                                  <span className="absolute inline-flex size-3 animate-ping rounded-full bg-red-500/45 blur-[1px]" />
                                  <span className="relative inline-flex size-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                                </span>
                                <CalendarDays className="size-3.5 text-primary/60" />
                                <span className="font-medium text-foreground/85">
                                  {fechaCorta(c.proximaClase)}
                                </span>
                              </span>
                            ) : (
                              <span aria-hidden="true" />
                            )}
                            {c.rating > 0 ? (
                              <span className="flex items-center gap-1 font-semibold text-[hsl(45,100%,60%)]">
                                <FaStar className="size-3.5" />
                                {c.rating.toFixed(1)}
                              </span>
                            ) : (
                              <span aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </RevealStagger>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
