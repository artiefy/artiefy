'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useAuth } from '@clerk/nextjs';
import { GrOverview } from 'react-icons/gr';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import useSWR from 'swr';

import StudentGradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { type CarouselApi } from '~/components/estudiantes/ui/carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/estudiantes/ui/carousel';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

import type { EnrolledCourse } from '~/server/actions/estudiantes/courses/getEnrolledCourses';

export default function MyCoursesPreview() {
  const { isSignedIn } = useAuth();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const carouselOptions = {
    align: 'start' as const,
    containScroll: 'trimSnaps' as const,
  };

  // SWR para cursos inscritos - solo si esta autenticado
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

  useEffect(() => {
    if (!carouselApi) return;

    const updateScrollState = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
    };

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
      return 'https://placehold.co/600x400/01152D/3AF4EF?text=Artiefy&font=MONTSERRAT';
    }
    const s3Url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`;
    return `/api/image-proxy?url=${encodeURIComponent(s3Url)}`;
  }

  // Si no esta autenticado, no mostrar nada (ocultar la seccion)
  if (!isSignedIn) {
    return null;
  }

  // Skeleton while loading
  if (isLoading) {
    return (
      <section className="mb-8 overflow-visible pr-4 pl-4 sm:px-24">
        <div className="mb-4 flex items-center justify-between pr-4 sm:pr-0">
          <div className="flex items-center gap-2">
            <GrOverview className="text-xl text-white" />
            <StudentGradientText className="text-2xl sm:text-3xl">
              Seguir viendo
            </StudentGradientText>
          </div>
        </div>

        <div className="group/carousel relative">
          <Carousel opts={carouselOptions}>
            <CarouselContent className="gap-4 pt-3 pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <CarouselItem
                  key={i}
                  className="basis-[280px] px-1 sm:basis-[320px] sm:px-2"
                >
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#123055] bg-[#061C37]">
                    <Skeleton className="h-40 w-full rounded-none" />
                    <div className="flex-1 space-y-3 p-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-full" />
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
      <section className="mb-8 overflow-visible pr-4 pl-4 sm:px-24">
        <div className="mb-4 flex items-center justify-between pr-4 sm:pr-0">
          <div className="flex items-center gap-2">
            <GrOverview className="text-xl text-white" />
            <StudentGradientText className="text-2xl sm:text-3xl">
              Seguir viendo
            </StudentGradientText>
          </div>
        </div>
        <div className="p-6 text-center text-red-400">
          Error al cargar tus cursos. Por favor, recarga la pagina o verifica tu
          conexion.
        </div>
      </section>
    );
  }

  if (!courses || courses.length === 0) return null;

  return (
    <section className="mb-8 overflow-visible pr-4 pl-4 sm:px-24">
      <div className="mb-4 flex items-center justify-between pr-4 sm:pr-0">
        <div className="flex items-center gap-2">
          <GrOverview className="text-xl text-white" />
          <StudentGradientText className="text-2xl sm:text-3xl">
            Seguir viendo
          </StudentGradientText>
        </div>
        <Link
          href="/estudiantes/myaccount"
          className="text-primary text-sm underline"
        >
          Ver todos
        </Link>
      </div>

      <div className="group/carousel relative z-20 overflow-visible">
        <Carousel opts={carouselOptions} setApi={setCarouselApi}>
          <CarouselContent className="gap-4 pt-3 pb-2">
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

              const courseHref = targetLessonId
                ? `/estudiantes/clases/${targetLessonId}`
                : `/estudiantes/cursos/${course.id}`;
              const progress = Math.min(
                Math.max(Math.round(course.progress ?? 0), 0),
                100
              );
              const badgeHeading = 'Continuar :';
              const badgeSubtitle = targetLessonTitle ?? 'Ir al curso';
              const titleText = course.title ?? '';
              const titleLength = titleText.length;
              const titleWordCount = titleText.trim().split(/\s+/).length;
              const isShortTitle = titleLength <= 32 && titleWordCount <= 6;
              const categorySpacingClass = isShortTitle ? '-mt-4 mb-0' : 'mb-1';
              const progressSpacingClass = isShortTitle ? 'mt-2' : 'mt-0.5';

              return (
                <CarouselItem
                  key={course.id}
                  className="basis-[280px] px-1 sm:basis-[320px] sm:px-2"
                >
                  <Link
                    href={courseHref}
                    className="group relative flex h-full transform-gpu flex-col overflow-hidden rounded-2xl bg-[#061C37] shadow-none transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform hover:-translate-y-2 hover:shadow-[0_18px_32px_-10px_rgba(0,0,0,0.65)]"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-[#061C37] will-change-transform">
                      <Image
                        src={getImageUrl(course.coverImageKey)}
                        alt={course.title}
                        fill
                        className="h-full w-full object-cover"
                        sizes="(max-width: 768px) 100vw, 420px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#061C37] via-[#061C37]/60 to-transparent" />

                      <div className="bg-primary absolute top-3 right-3 rounded-lg px-3 py-1.5 text-[#0b1220] shadow-lg">
                        <p className="text-xs leading-tight font-semibold text-[#0b1220]">
                          {badgeHeading}
                        </p>
                        <p
                          className="max-w-[140px] truncate text-[10px] leading-tight font-normal text-[#0b1220] opacity-90"
                          title={badgeSubtitle}
                        >
                          {badgeSubtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col bg-[#061C37] p-4">
                      <h4
                        className="mb-1 line-clamp-2 min-h-[38px] text-sm leading-snug font-semibold text-white"
                        title={course.title}
                      >
                        {course.title}
                      </h4>

                      <p
                        className={`${categorySpacingClass} text-xs text-[#94A3B8]`}
                      >
                        {course.category?.name ?? 'Sin categoria'}
                      </p>

                      <div
                        className={`${progressSpacingClass} flex items-center gap-3`}
                      >
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#0f2744]">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-xs font-medium">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

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
