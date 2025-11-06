'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

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
    <section className="mb-8 px-12 sm:px-24">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-primary text-2xl font-bold">Seguir viendo</h3>
        <Link
          href="/estudiantes/mis-cursos"
          className="text-sm text-gray-300 underline"
        >
          Ver todos
        </Link>
      </div>

      <div className="relative">
        <Carousel>
          <CarouselContent className="gap-x-4">
            {courses.slice(0, 8).map((course) => (
              <CarouselItem
                key={course.id}
                // Mobile: smaller cards to show 1.5, tablet: 2 cards, desktop: 3 cards + peek
                className="max-w-[220px] basis-auto px-2 sm:max-w-[400px] sm:basis-1/2 lg:max-w-[430px] lg:basis-[30%]"
              >
                <div className="group block overflow-hidden rounded-lg bg-[#071827] p-0 shadow-md">
                  <div className="relative h-56 w-full overflow-hidden rounded-t-lg bg-gray-900">
                    <Image
                      src={getImageUrl(course.coverImageKey)}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 420px"
                    />
                    {/* Compute target lesson: prefer continueLessonId, fallback to firstLessonId */}
                    {(() => {
                      // Prefer lastUnlockedLesson, then continueLesson, then firstLesson
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
                        <Link
                          href={`/estudiantes/cursos/${course.id}/lecciones/${targetLessonId}`}
                          className="bg-primary/90 hover:bg-primary absolute top-3 right-3 z-20 rounded px-3 py-2 backdrop-blur-sm"
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
                      );
                    })()}
                  </div>
                  <div className="p-4">
                    <Link
                      href={`/estudiantes/cursos/${course.id}`}
                      className="block"
                    >
                      <h4 className="line-clamp-2 text-base font-semibold text-white">
                        {course.title}
                      </h4>
                    </Link>
                    <p className="mt-1 text-sm text-gray-300">
                      {course.category?.name ?? 'Sin categoría'}
                    </p>
                    <div className="mt-3">
                      <div className="flex w-full items-center gap-3">
                        <div className="flex-1">
                          <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-700">
                            <div
                              className="absolute top-0 left-0 h-3 rounded-full bg-white/80 shadow-inner"
                              style={{
                                width: `${Math.min(Math.max(course.progress ?? 0, 0), 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-16 text-right">
                          <span className="text-sm font-semibold text-white">
                            {Math.round(course.progress ?? 0)}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Educador: {course.instructorName}
                        </div>
                        <div className="text-sm font-semibold text-yellow-400">
                          {(course.rating ?? 0).toFixed(1)}
                        </div>
                      </div>
                    </div>
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
