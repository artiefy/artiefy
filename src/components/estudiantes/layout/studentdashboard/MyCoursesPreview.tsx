'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

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
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/enrolled-courses');
        if (!res.ok) throw new Error('Failed to fetch');
        const payload: { courses?: EnrolledCourse[] } = await res.json();
        if (!mounted) return;
        setCourses(payload.courses ?? []);
      } catch (err) {
        console.error('Error loading enrolled courses:', err);
        if (mounted) setCourses([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  function getImageUrl(coverImageKey: string | null | undefined) {
    if (!coverImageKey || coverImageKey === 'NULL') {
      return 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
    }
    const s3Url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`;
    return `/api/image-proxy?url=${encodeURIComponent(s3Url)}`;
  }

  // Skeleton while loading
  if (loading) {
    return (
      <section className="mb-8 px-12 sm:px-24">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-primary text-2xl font-bold">Seguir viendo</h3>
        </div>

        <div className="relative">
          <Carousel>
            <CarouselContent className="gap-x-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CarouselItem
                  key={i}
                  // Mobile: smaller cards to show 1.5, tablet: 2 cards, desktop: 3 cards + peek
                  className="max-w-[220px] basis-auto px-2 sm:max-w-[400px] sm:basis-1/2 lg:max-w-[430px] lg:basis-[30%]"
                >
                  <div className="block animate-pulse overflow-hidden rounded-lg bg-[#071827] p-0 shadow-md">
                    <div className="h-56 w-full rounded-t-lg bg-gray-800" />
                    <div className="p-4">
                      <div className="h-4 w-3/4 rounded bg-gray-700" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-700" />
                      <div className="mt-4 h-3 w-full rounded bg-gray-700" />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-9 size-8 bg-black/50 text-white sm:-left-20 sm:size-12" />
            <CarouselNext className="-right-9 size-8 bg-black/50 text-white sm:-right-20 sm:size-12" />
          </Carousel>
        </div>
      </section>
    );
  }

  if (!courses || courses.length === 0) return null;

  return (
    <section className="mb-8 pr-0 pl-4 sm:px-24">
      <div className="mb-4 flex items-center justify-between pr-4 sm:pr-0">
        <h3 className="text-primary text-2xl font-bold">Seguir viendo</h3>
        <Link
          href="/estudiantes/mis-cursos"
          className="text-sm text-gray-300 underline"
        >
          Ver todos
        </Link>
      </div>

      <div className="relative">
        <Carousel setApi={setCarouselApi}>
          <CarouselContent className="gap-x-2">
            {courses.slice(0, 8).map((course) => (
              <CarouselItem
                key={course.id}
                // Mobile: 85% width to show peek, tablet: 2 cards, desktop: 3 cards + peek
                className="basis-[85%] sm:basis-1/2 lg:basis-[30%]"
              >
                <div className="group relative block h-56 w-full overflow-hidden rounded-lg bg-[#071827] shadow-md">
                  {/* Imagen de fondo con link */}
                  <Link
                    href={`/estudiantes/cursos/${course.id}`}
                    className="absolute inset-0 block"
                  >
                    <Image
                      src={getImageUrl(course.coverImageKey)}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 420px"
                    />
                    {/* Overlay gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  </Link>

                  {/* Content overlay */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
                    {/* Top right: Continue lesson button */}
                    {(() => {
                      const targetLessonId =
                        course.lastUnlockedLessonId ??
                        course.continueLessonId ??
                        course.firstLessonId ??
                        null;
                      const targetLessonNumber =
                        course.lastUnlockedLessonNumber ??
                        course.continueLessonNumber ??
                        1;
                      const targetLessonTitle =
                        course.lastUnlockedLessonTitle ??
                        course.continueLessonTitle ??
                        null;

                      if (!targetLessonId) return null;
                      return (
                        <div className="flex justify-end">
                          <Link
                            href={`/estudiantes/cursos/${course.id}/lecciones/${targetLessonId}`}
                            className="bg-primary/90 hover:bg-primary pointer-events-auto rounded px-3 py-2 backdrop-blur-sm transition-colors"
                          >
                            <div className="font-semibold whitespace-nowrap text-gray-800">
                              Seguir: Clase {targetLessonNumber}
                            </div>
                            {targetLessonTitle && (
                              <div
                                title={targetLessonTitle}
                                className="mt-1 max-w-[160px] truncate text-[11px] font-bold text-black"
                              >
                                {targetLessonTitle}
                              </div>
                            )}
                          </Link>
                        </div>
                      );
                    })()}

                    {/* Bottom: Title, category and progress bar */}
                    <div className="space-y-2">
                      <div>
                        <h4 className="line-clamp-2 text-base font-semibold text-white drop-shadow-lg">
                          {course.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-200 drop-shadow">
                          {course.category?.name ?? 'Sin categoría'}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="flex w-full items-center gap-3">
                        <div className="flex-1">
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-700/50 backdrop-blur-sm">
                            <div
                              className="bg-primary absolute top-0 left-0 h-2 rounded-full shadow-inner"
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
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-9 hidden size-8 bg-black/50 text-white sm:-left-20 sm:flex sm:size-12" />
          <CarouselNext className="-right-9 hidden size-8 bg-black/50 text-white sm:-right-20 sm:flex sm:size-12" />
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
