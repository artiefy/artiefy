'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  RocketLaunchIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { LoadingCourses } from '~/components/estudiantes/layout/LoadingCourses';
import { Badge } from '~/components/estudiantes/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/estudiantes/ui/carousel';
import { blurDataURL } from '~/lib/blurDataUrl';
import { type Course } from '~/types';
import '~/styles/searchBar.css'; // Import the new CSS file

interface StudentDashboardProps {
  initialCourses: Course[];
  children: React.ReactNode;
}

export default function StudentDashboard({ initialCourses, children }: StudentDashboardProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(initialCourses);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(
        (prevSlide) => (prevSlide + 1) % Math.min(courses.length, 5)
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [courses.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCourses(prevCourses => {
        return prevCourses.map(course => ({
          ...course,
          lastUpdated: new Date().toISOString()
        }));
      });
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = useCallback(
    (searchTerm: string) => {
      setIsLoading(true);
      const lowercasedTerm = searchTerm.toLowerCase();
      setFilteredCourses(
        courses.filter(
          (course) =>
            (course.title.toLowerCase().includes(lowercasedTerm) ||
              course.description?.toLowerCase().includes(lowercasedTerm)) ?? false
        )
      );
      setIsLoading(false);
    },
    [courses]
  );

  if (isLoading) {
    return <LoadingCourses />;
  }

  // Ordenar los cursos por fecha de subida (suponiendo que tienen una propiedad `createdAt`)
  const sortedCourses = [...courses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Seleccionar los últimos 5 cursos para el carrusel
  const latestFiveCourses = sortedCourses.slice(0, 5);

  // Seleccionar los últimos 10 cursos para el "Top Cursos"
  const latestTenCourses = sortedCourses.slice(0, 10);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="grow">
        <div className="container mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex flex-col space-y-12 sm:space-y-16">
            {/* BUSCADOR IA */}
            {!isLoading && (
              <div className="flex flex-col items-center mt-8 space-y-4">
                <div className="flex items-center">
                  <RocketLaunchIcon className="size-6 text-orange-500 sm:size-7" />
                  <span className="ml-2 whitespace-nowrap text-2xl font-bold text-primary sm:text-3xl">
                    Arti IA
                  </span>
                </div>
                <form
                  className="flex w-full max-w-2xl flex-col items-center space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const searchTerm = (e.target as HTMLFormElement).elements.namedItem('search') as HTMLInputElement;
                    handleSearch(searchTerm.value);
                  }}
                >
                  <div className="input-container">
                    <input
                      required
                      className="input"
                      name="search"
                      placeholder="Dime que deseas buscar..."
                      type="search"
                    />
                  </div>
                </form>
              </div>
            )}

            {/* CAROUSEL GRANDE */}
            <div className="relative h-[300px] overflow-hidden sm:h-[400px] md:h-[500px] px-8">
              {latestFiveCourses.map((course, index) => (
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
                    <p className="mb-1 hidden text-sm font-bold text-red-500 sm:block sm:text-base md:text-lg">
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
                {latestFiveCourses.map((_, index) => (
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

            {/* CAROUSEL TOP CURSOS */}
            <div className="relative xs:px-4 px-8">
              <h2 className="ml-4 text-xl font-bold text-primary md:text-2xl">
                Top Cursos
              </h2>
              <Carousel className="w-full p-4">
                <CarouselContent>
                  {latestTenCourses.map((course) => (
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
                          <Link href={`/estudiantes/cursos/${course.id}`}>
                            <h3 className="text-lg font-bold text-white hover:underline active:scale-95">
                              {course.title}
                            </h3>
                          </Link>
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

            {/* Seccion De Cursos */}
            <div className="flex flex-col px-8">
              <h2 className="mb-2 text-2xl font-bold sm:text-3xl">
                Cursos Artiefy
              </h2>
              <React.Suspense fallback={<LoadingCourses />}>
                {React.Children.map(children, child =>
                  React.isValidElement(child)
                    ? React.cloneElement(child as React.ReactElement<{ courses: Course[] }>, { courses: filteredCourses })
                    : child
                )}
              </React.Suspense>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
