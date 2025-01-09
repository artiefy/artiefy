"use client";

import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import CourseCategories from "~/components/layout/CourseCategories";
import CourseListStudent from "~/components/layout/CourseListStudent";
import Footer from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { SkeletonCard } from "~/components/layout/SkeletonCard";
import { Badge } from "~/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { Skeleton } from "~/components/ui/skeleton";

const ITEMS_PER_PAGE = 9;

interface Course {
  id: number;
  title: string;
  coverImageKey: string;
  category: {
    name: string;
  };
  description: string;
  instructor: string;
  rating?: number;
  modalidad: {
    name: string;
  };
  createdAt: string;
}

function LoadingCourses() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (!response.ok) throw new Error(response.statusText);
      const data = (await response.json()) as Course[];
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setCourses(data);
      setFilteredCourses(data);
      setCarouselIndex(0);
    } catch (error) {
      console.error("Error al obtener los cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    const filtered = courses.filter((course) =>
      course.title.toLowerCase().includes(search.toLowerCase()),
    );
    setFilteredCourses(filtered);
    setCurrentPage(1);
  };

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleCarouselChange = (index: number) => {
    setCarouselIndex(index);
  };

  useEffect(() => {
    void fetchCourses();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex(
        (prevIndex) => (prevIndex + 1) % Math.min(courses.length, 5),
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [courses]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex flex-col space-y-12 sm:space-y-16">
            {/* CAROUSEL GRANDE*/}
            <div className="relative h-[300px] overflow-hidden sm:h-[400px] md:h-[500px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : (
                courses.slice(0, 5).map((course, index) => (
                  <div
                    key={course.id}
                    className={`absolute h-full w-full transition-opacity duration-500 ${
                      index === carouselIndex ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                        alt={course.title}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        sizes="100vw"
                        quality={85}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIHN0b3AtY29sb3I9IiNlZWUiIG9mZnNldD0iMjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iI2Y1ZjVmNSIgb2Zmc2V0PSI1MCUiLz48c3RvcCBzdG9wLWNvbG9yPSIjZWVlIiBvZmZzZXQ9IjcwJSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZWVlIi8+PHJlY3QgaWQ9InIiIHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2cpIi8+PGFuaW1hdGUgeGxpbms6aHJlZj0iI3IiIGF0dHJpYnV0ZU5hbWU9IngiIGZyb209Ii02MDAiIHRvPSI2MDAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9zdmc+"
                        onLoad={() =>
                          console.log(`Image ${course.title} loaded`)
                        }
                      />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 p-4 text-primary">
                      <h2 className="mb-2 text-center text-2xl font-semibold sm:mb-4 sm:text-3xl md:text-4xl">
                        {course.title}
                      </h2>
                      <Badge
                        variant="outline"
                        className="mb-2 border-primary text-primary"
                      >
                        {course.category.name}
                      </Badge>
                      <p className="mb-2 hidden text-center text-sm sm:block sm:text-base md:text-lg lg:text-xl">
                        {course.description}
                      </p>
                      <p className="mb-1 hidden text-sm font-bold sm:block sm:text-base md:text-lg">
                        Educador: {course.instructor}
                      </p>
                      <p className="mb-1 hidden text-sm text-red-500 sm:block sm:text-base md:text-lg">
                        {course.modalidad.name}
                      </p>
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-500 sm:h-5 sm:w-5" />
                        <span className="ml-1 text-sm text-yellow-500 sm:text-base">
                          {(course.rating ?? 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {courses.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleCarouselChange(index)}
                    className={`h-2 w-2 rounded-full sm:h-3 sm:w-3 ${
                      index === carouselIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* BUSCADOR IA */}
            <div className="flex justify-center sm:justify-end">
              <form className="flex w-full max-w-lg flex-col items-center space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                <div className="flex items-center">
                  <RocketLaunchIcon className="h-5 w-5 text-orange-500 sm:h-6 sm:w-6" />
                  <span className="ml-2 whitespace-nowrap text-lg text-primary sm:text-xl">
                    Artiefy IA
                  </span>
                </div>
                <div className="relative w-full max-w-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    required
                    placeholder="Buscar..."
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    type="text"
                  />
                </div>
                <button
                  className="inline-flex items-center rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-background hover:bg-primary/90 hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/50"
                  type="submit"
                >
                  <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                  Buscar
                </button>
              </form>
            </div>

            <CourseCategories />

            {/* CAROUSEL TOP CURSOS */}
            <div className="relative">
              <h2 className="ml-4 text-xl text-primary md:text-2xl">
                Top Cursos
              </h2>
              <Carousel className="w-full p-4">
                <CarouselContent>
                  {loading
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton
                          key={index}
                          className="ml-4 h-48 w-full rounded-lg px-6 md:h-64"
                        />
                      ))
                    : courses.map((course) => (
                        <CarouselItem
                          key={course.id}
                          className="pl-4 md:basis-1/2 lg:basis-1/3"
                        >
                          <div className="relative h-48 w-full md:h-64">
                            <Image
                              src={
                                course.coverImageKey
                                  ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
                                  : "https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT"
                              }
                              alt={course.title}
                              fill
                              className="rounded-lg object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              quality={85}
                              placeholder="blur"
                              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIHN0b3AtY29sb3I9IiNlZWUiIG9mZnNldD0iMjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iI2Y1ZjVmNSIgb2Zmc2V0PSI1MCUiLz48c3RvcCBzdG9wLWNvbG9yPSIjZWVlIiBvZmZzZXQ9IjcwJSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZWVlIi8+PHJlY3QgaWQ9InIiIHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2cpIi8+PGFuaW1hdGUgeGxpbms6aHJlZj0iI3IiIGF0dHJpYnV0ZU5hbWU9IngiIGZyb209Ii02MDAiIHRvPSI2MDAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9zdmc+"
                              onLoad={() =>
                                console.log(`Image ${course.title} loaded`)
                              }
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                              <h3 className="text-lg font-bold text-white">
                                {course.title}
                              </h3>
                              <div className="mb-2 flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className="border-primary bg-background text-primary hover:bg-black hover:bg-opacity-90"
                                >
                                  {course.category.name}
                                </Badge>
                                <span className="text-sm font-bold text-red-500">
                                  {course.modalidad.name}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm italic text-primary">
                                  Educador: <span>{course.instructor}</span>
                                </p>
                                <div className="flex items-center">
                                  <StarIcon className="h-4 w-4 text-yellow-500" />
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
                <CarouselPrevious className="mr-7 h-12 w-12 bg-black bg-opacity-50 text-white" />
                <CarouselNext className="ml-4 h-12 w-12 bg-black bg-opacity-50 text-white" />
              </Carousel>
            </div>

            {/* BUSCADOR Cursos Disponibles */}
            <div className="flex justify-center sm:justify-end">
              <form className="flex w-full max-w-2xl flex-col items-center sm:flex-row sm:space-x-2 sm:space-y-0">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-orange-500 sm:h-6 sm:w-6" />
                  <span className="ml-2 whitespace-nowrap text-lg text-primary sm:text-xl">
                    Busca Tu Curso
                  </span>
                </div>
                <div className="relative w-full max-w-2xl">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    required
                    placeholder="Buscar..."
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 focus:border-primary focus:ring-primary"
                    type="search"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </form>
            </div>

            {/* Seccion De Cursos */}
            <div className="flex flex-col px-11">
              <h2 className="text-2xl font-bold sm:text-3xl mb-8">
                Cursos Disponibles
              </h2>
              {loading && <LoadingCourses />}
              <Suspense fallback={<LoadingCourses />}>
                <CourseListStudent courses={paginatedCourses} />
              </Suspense>
            </div>

            {/* PAGINACION */}
            <Pagination className="pb-12">
              <PaginationContent className="flex flex-wrap justify-center gap-2">
                {currentPage > 1 && (
                  <PaginationPrevious
                    onClick={() => setCurrentPage(currentPage - 1)}
                  />
                )}
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
                {currentPage < totalPages && (
                  <PaginationNext
                    onClick={() => setCurrentPage(currentPage + 1)}
                  />
                )}
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
