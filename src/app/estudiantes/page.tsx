'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import CourseCategories from '~/components/estudiantes/layout/CourseCategories';
import CourseListStudent from '~/components/estudiantes/layout/CourseListStudent';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { Badge } from '~/components/estudiantes/ui/badge';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/estudiantes/ui/carousel';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/estudiantes/ui/pagination';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';
import { blurDataURL } from '~/lib/blurDataUrl';
import { getAllCourses } from '~/server/actions/studentActions';
import { type Course } from '~/types';

function LoadingCourses() {
  return (
    <>
      {/* Skeleton para el carousel grande */}
      <Skeleton className="h-[300px] w-full rounded-lg sm:h-[400px] md:h-[500px]" />

      {/* Skeleton para el carousel de top cursos */}
      <div className="space-y-3">
        <Skeleton className="ml-4 h-[20px] w-[100px] rounded-lg" />{' '}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="ml-4 h-48 w-full rounded-lg px-6 md:h-64"
            />
          ))}
        </div>
      </div>

      {/* Skeleton para las categorías */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] w-full rounded-lg" />
        ))}
      </div>

      {/* Skeleton para la lista de cursos */}
      <div className="px-12 pb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const ITEMS_PER_PAGE = 9;

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllCourses();
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      console.error('Error al obtener los cursos:', error);
      // Mostrar un mensaje de error al usuario
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  const handleCategorySelect = useCallback(
    (category: string | null) => {
      if (category) {
        setFilteredCourses(
          courses.filter((course) => course.category?.name === category)
        );
      } else {
        setFilteredCourses(courses);
      }
      setCurrentPage(1);
    },
    [courses]
  );

  const handleSearch = useCallback(
    (searchTerm: string) => {
      const lowercasedTerm = searchTerm.toLowerCase();
      setFilteredCourses(
        courses.filter(
          (course) =>
            course.title.toLowerCase().includes(lowercasedTerm) ??
            course.description?.toLowerCase().includes(lowercasedTerm) ??
            false
        )
      );
      setCurrentPage(1);
    },
    [courses]
  );

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="grow">
          <div className="container mx-auto px-8 sm:px-12 lg:px-16">
            <div className="flex flex-col space-y-12 sm:space-y-16">
              <LoadingCourses />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex min-h-screen grow flex-col">
        <div className="container mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex flex-col space-y-12 sm:space-y-16">
            {/* CAROUSEL GRANDE*/}
            <div className="relative h-[300px] overflow-hidden sm:h-[400px] md:h-[500px]">
              {courses.slice(0, 5).map((course, index) => (
                <div
                  key={course.id}
                  className={`absolute size-full transition-opacity duration-500 ${
                    index === 0 ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="relative size-full">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                      alt={course.title}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="100vw"
                      quality={85}
                      placeholder="blur"
                      blurDataURL={blurDataURL}
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-4 text-primary">
                    <h2 className="mb-2 text-center text-2xl font-semibold sm:mb-4 sm:text-3xl md:text-4xl">
                      {course.title}
                    </h2>
                    <Badge
                      variant="outline"
                      className="mb-2 border-primary text-primary"
                    >
                      {course.category?.name ?? 'Sin categoría'}
                    </Badge>
                    <p className="mb-2 hidden text-center text-sm sm:block sm:text-base md:text-lg lg:text-xl">
                      {course.description}
                    </p>
                    <p className="mb-1 hidden text-sm font-bold sm:block sm:text-base md:text-lg">
                      Educador: {course.instructor}
                    </p>
                    <p className="mb-1 hidden text-sm text-red-500 sm:block sm:text-base md:text-lg">
                      {course.modalidad?.name ?? 'Modalidad no especificada'}
                    </p>
                    <div className="flex items-center">
                      <StarIcon className="size-4 text-yellow-500 sm:size-5" />
                      <span className="ml-1 text-sm text-yellow-500 sm:text-base">
                        {(course.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* BUSCADOR IA */}
            <div className="flex justify-center sm:justify-end">
              <form className="flex w-full max-w-lg flex-col items-center space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                <div className="flex items-center">
                  <RocketLaunchIcon className="size-5 text-orange-500 sm:size-6" />
                  <span className="ml-2 whitespace-nowrap text-lg text-primary sm:text-xl">
                    Artiefy IA
                  </span>
                </div>
                <div className="relative w-full max-w-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="size-4 text-gray-500" />
                  </div>
                  <input
                    required
                    placeholder="Buscar..."
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    type="text"
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <button
                  className="inline-flex items-center rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-background hover:bg-primary/90 hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/50"
                  type="submit"
                >
                  <MagnifyingGlassIcon className="mr-2 size-4" />
                  Buscar
                </button>
              </form>
            </div>

            {/* CAROUSEL TOP CURSOS */}
            <div className="relative xs:px-4">
              <h2 className="ml-4 text-xl font-bold text-primary md:text-2xl">
                Top Cursos
              </h2>
              <Carousel className="w-full p-4">
                <CarouselContent>
                  {courses.map((course) => (
                    <CarouselItem
                      key={course.id}
                      className="pl-4 md:basis-1/2 lg:basis-1/3"
                    >
                      <div className="relative h-48 w-full md:h-64">
                        <Image
                          src={
                            course.coverImageKey
                              ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
                              : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
                          }
                          alt={course.title}
                          fill
                          className="rounded-lg object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          quality={85}
                          placeholder="blur"
                          blurDataURL={blurDataURL}
                          unoptimized
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-white">
                          <h3 className="text-lg font-bold text-white">
                            {course.title}
                          </h3>
                          <div className="mb-2 flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className="border-primary bg-background text-primary hover:bg-black"
                            >
                              {course.category?.name}
                            </Badge>
                            <span className="text-sm font-bold text-red-500">
                              {course.modalidad?.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm italic text-primary">
                              Educador: <span>{course.instructor}</span>
                            </p>
                            <div className="flex items-center">
                              <StarIcon className="size-4 text-yellow-500" />
                              <span className="ml-1 text-sm font-bold text-yellow-500">
                                {(course.rating ?? 0).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="mr-7 size-12 bg-black/50 text-white" />
                <CarouselNext className="ml-4 size-12 bg-black/50 text-white" />
              </Carousel>
            </div>

            {/* CATEGORIAS DE CURSOS */}
            <CourseCategories
              onCategorySelect={handleCategorySelect}
              onSearch={handleSearch}
            />

            {/* Seccion De Cursos */}
            <div className="flex flex-col px-11">
              <h2 className="mb-8 text-2xl font-bold sm:text-3xl">
                Cursos Disponibles
              </h2>
              <React.Suspense fallback={<LoadingCourses />}>
                <CourseListStudent courses={paginatedCourses} />
              </React.Suspense>
            </div>

            {/* PAGINACION */}
            <Pagination className="pb-12">
              <PaginationContent className="flex cursor-pointer flex-wrap justify-center gap-2">
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={
                    currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''
                  }
                />
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      onClick={() => setCurrentPage(index + 1)}
                      isActive={currentPage === index + 1}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={
                    currentPage === totalPages
                      ? 'cursor-not-allowed opacity-50'
                      : ''
                  }
                />
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
