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
import { blurDataURL } from '~/lib/blurDataUrl';
import { type Course } from '~/types';
import { LoadingCourses } from '~/components/estudiantes/layout/LoadingCourses';

const ITEMS_PER_PAGE = 9;

interface StudentDashboardProps {
  initialCourses: Course[];
}

export default function StudentDashboard({ initialCourses }: StudentDashboardProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(initialCourses);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(
        (prevSlide) => (prevSlide + 1) % Math.min(courses.length, 5)
      );
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [courses.length]);

  // Nuevo useEffect para demostrar el uso de setCourses
  useEffect(() => {
    // Simulación de actualización de cursos después de un tiempo
    const timer = setTimeout(() => {
      setCourses(prevCourses => {
        // Aquí podrías hacer una llamada a la API para obtener cursos actualizados
        // Por ahora, solo añadiremos un campo 'lastUpdated' a cada curso
        return prevCourses.map(course => ({
          ...course,
          lastUpdated: new Date().toISOString()
        }));
      });
    }, 60000); // Actualizar después de 1 minuto

    return () => clearTimeout(timer);
  }, []);

  const handleCategorySelect = useCallback(
    (category: string | null) => {
      setIsLoading(true);
      if (category) {
        setFilteredCourses(
          courses.filter((course) => course.category?.name === category)
        );
      } else {
        setFilteredCourses(courses);
      }
      setCurrentPage(1);
      setIsLoading(false);
    },
    [courses]
  );

  const handleSearch = useCallback(
    (searchTerm: string) => {
      setIsLoading(true);
      const lowercasedTerm = searchTerm.toLowerCase();
      setFilteredCourses(
        courses.filter(
          (course) =>
            (course.title.toLowerCase().includes(lowercasedTerm) ||
              course.description?.toLowerCase().includes(lowercasedTerm)) ??
            false
        )
      );
      setCurrentPage(1);
      setIsLoading(false);
    },
    [courses]
  );

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return <LoadingCourses />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="grow">
        <div className="container mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex flex-col space-y-12 sm:space-y-16">
            {/* CAROUSEL GRANDE*/}
            <div className="relative h-[300px] overflow-hidden sm:h-[400px] md:h-[500px]">
              {courses.slice(0, 5).map((course, index) => (
                <div
                  key={course.id}
                  className={`absolute size-full transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="relative size-full">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                      alt={course.title}
                      fill
                      className="object-cover"
                      priority={index === currentSlide}
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
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
                {courses.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    className={`size-3 rounded-full ${
                      index === currentSlide ? 'bg-primary' : 'bg-gray-300'
                    }`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
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
                    type="search"
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

