'use client';

import React, { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useAuth } from '@clerk/nextjs';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import useSWR from 'swr';

import { type CarouselApi } from '~/components/estudiantes/ui/carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/estudiantes/ui/carousel';

import type { EnrolledCourse } from '~/server/actions/estudiantes/courses/getEnrolledCourses';

export default function MyCoursesPreview() {
  const { isSignedIn } = useAuth();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);

  // SWR para cursos inscritos - solo si está autenticado
  const fetcher = (url: string) =>
    fetch(url).then((r) => {
      if (!r.ok) throw new Error('No se pudo cargar los cursos');
      return r.json();
    });
  const { data, error, isLoading } = useSWR<{ courses?: EnrolledCourse[] }>(
    isSignedIn ? '/api/enrolled-courses' : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );
  const courses = data?.courses ?? [];

  React.useEffect(() => {
    if (!carouselApi) return;

    const updateScrollState = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
    };

    // Actualizar al montar y cuando cambie el scroll
    updateScrollState();
    carouselApi.on('scroll', updateScrollState);
    carouselApi.on('select', updateScrollState);

    return () => {
      carouselApi.off('scroll', updateScrollState);
      carouselApi.off('select', updateScrollState);
    };
  }, [carouselApi]);

  function getImageUrl(coverImageKey: string | null | undefined) {
    if (!coverImageKey || coverImageKey === 'NULL') {
      return 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
    }
    const s3Url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`;
    return `/api/image-proxy?url=${encodeURIComponent(s3Url)}`;
  }

  // Si no está autenticado, no mostrar nada (ocultar la sección)
  if (!isSignedIn) {
    return null;
  }

  // Skeleton while loading
  if (isLoading) {
    return (
      <section className="mb-8 px-12 sm:px-24">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-primary text-2xl font-bold">Seguir viendo</h3>
        </div>

        <div className="group/carousel relative">
          <Carousel>
            <CarouselContent className="gap-x-4 py-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CarouselItem
                  key={i}
                  // Mobile: smaller cards to show 1.5, tablet: 2 cards, desktop: 3 cards + peek
                  className="max-w-[220px] basis-auto px-2 sm:max-w-[400px] sm:basis-1/2 lg:max-w-[430px] lg:basis-[30%]"
                >
                  <div className="block animate-pulse overflow-hidden rounded-2xl bg-[#071827] p-0 shadow-md">
                    <div className="h-56 w-full rounded-t-2xl bg-gray-800" />
                    <div className="p-4">
                      <div className="h-4 w-3/4 rounded bg-gray-700" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-700" />
                      <div className="mt-4 h-3 w-full rounded bg-gray-700" />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8 px-12 sm:px-24">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-primary text-2xl font-bold">Seguir viendo</h3>
        </div>
        <div className="p-6 text-center text-red-400">
          Error al cargar tus cursos. Por favor, recarga la página o verifica tu
          conexión.
        </div>
      </section>
    );
  }

  if (!courses || courses.length === 0) return null;

  return (
    <section className="mb-8 overflow-visible pr-0 pl-4 sm:px-24">
      <div className="mb-4 flex items-center justify-between pr-4 sm:pr-0">
        <h3 className="text-primary text-2xl font-bold">Seguir viendo</h3>
        <Link
          href="/estudiantes/myaccount"
          className="text-sm text-gray-300 underline"
        >
          Ver todos
        </Link>
      </div>

      <div className="group/carousel relative z-20 overflow-visible">
        <Carousel setApi={setCarouselApi}>
          <CarouselContent className="gap-x-2 py-3">
            {courses.slice(0, 8).map((course) => {
              const targetLessonId =
                course.lastUnlockedLessonId ??
                course.continueLessonId ??
                course.firstLessonId ??
                null;
              const targetLessonTitle =
                course.lastUnlockedLessonTitle ??
                course.continueLessonTitle ??
                null;

              return (
                <CarouselItem
                  key={course.id}
                  // Mobile: 85% width to show peek, tablet: 2 cards, desktop: 3 cards + peek
                  className="basis-[85%] sm:basis-1/2 lg:basis-[24%]"
                >
                  <div className="group relative z-10 block h-64 w-full transform-gpu overflow-hidden rounded-2xl bg-[#071827] shadow-md transition-transform duration-300 will-change-transform hover:z-[99999] hover:-translate-y-2 hover:shadow-xl">
                    {/* Imagen de fondo con link */}
                    <Link
                      href={
                        targetLessonId
                          ? `/estudiantes/clases/${targetLessonId}`
                          : `/estudiantes/cursos/${course.id}`
                      }
                      className="absolute inset-0 block"
                    >
                      <Image
                        src={getImageUrl(course.coverImageKey)}
                        alt={course.title}
                        fill
                        className="rounded-2xl object-cover"
                        sizes="(max-width: 768px) 100vw, 420px"
                      />
                      {/* Overlay gradient for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </Link>

                    {/* Content overlay */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
                      {/* Removed top-right 'Seguir' button - show continuation info inline instead */}

                      {/* Bottom: Continuation label, lesson info, title, category and progress bar */}
                      <div className="space-y-2">
                        <div className="mt-2">
                          {/* Top right: badge preserved but text changed to 'Continuar' */}
                          {targetLessonId && (
                            <div className="flex justify-end">
                              <Link
                                href={`/estudiantes/clases/${targetLessonId}`}
                                className="bg-primary hover:bg-primary/90 pointer-events-auto rounded-2xl px-6 py-2 transition-colors"
                              >
                                <div className="text-xs leading-tight font-bold whitespace-nowrap text-black">
                                  Continuar
                                </div>
                                <div
                                  className="max-w-[160px] truncate text-[11px] leading-tight font-semibold text-black"
                                  title={targetLessonTitle ?? ''}
                                >
                                  {targetLessonTitle ?? ''}
                                </div>
                              </Link>
                            </div>
                          )}

                          <div className="mt-22">
                            <h4
                              className="truncate text-base font-semibold text-white drop-shadow-lg"
                              title={course.title}
                            >
                              {course.title}
                            </h4>
                            <p className="mt-2 text-sm text-gray-200 drop-shadow">
                              {course.category?.name ?? 'Sin categoría'}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex w-full items-center gap-3">
                          <div className="flex-1">
                            <div className="relative h-1 w-full overflow-hidden rounded-full bg-gray-700/50 backdrop-blur-sm">
                              <div
                                className="bg-primary absolute top-0 left-0 h-1 rounded-full shadow-inner"
                                style={{
                                  width: `${Math.min(Math.max(course.progress ?? 0, 0), 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-12 text-right">
                            <span className="text-sm font-semibold text-white drop-shadow">
                              {Math.round(course.progress ?? 0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        {/* Flechas funcionales solo en móvil */}
        {canScrollPrev && (
          <button
            onClick={() => carouselApi?.scrollPrev()}
            className="pointer-events-auto absolute top-1/2 left-2 -translate-y-1/2 sm:hidden"
            aria-label="Anterior"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <IoIosArrowBack className="text-2xl text-white" />
            </div>
          </button>
        )}
        <button
          onClick={() => carouselApi?.scrollNext()}
          className="pointer-events-auto absolute top-1/2 right-2 -translate-y-1/2 sm:hidden"
          aria-label="Siguiente"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
            <IoIosArrowForward className="text-2xl text-white" />
          </div>
        </button>
      </div>
    </section>
  );
}
