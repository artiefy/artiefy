"use client";

import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import CourseCategories from "~/components/educators/layout/CourseCategories";
import CourseListStudent from "~/components/educators/layout/CourseListStudent";
import Footer from "~/components/educators/layout/Footer";
import { Header } from "~/components/educators/layout/Header";
import { SkeletonCard } from "~/components/educators/layout/SkeletonCard";
import { AspectRatio } from "~/components/educators/ui/aspect-ratio";
import { Badge } from "~/components/educators/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/educators/ui/carousel";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/educators/ui/pagination";
import { Skeleton } from "~/components/educators/ui/skeleton";

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
  createdAt: string; // Añadido para la fecha de creación
}

function LoadingCourses() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      ); // Ordenar por fecha de creación descendente
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
    <div>
      <main className="container mx-auto px-40 md:px-48">
        <Header />
        <div className="flex flex-col space-y-8">
          {/* Carousel */}
          <div className="relative h-[500px] overflow-hidden">
            {loading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : (
              courses.slice(0, 5).map((course, index) => (
                <div
                  key={course.id}
                  className={`absolute h-full w-full transition-opacity duration-500 zoom-in ${
                    index === carouselIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </AspectRatio>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-primary">
                    <h2 className="mb-4 text-4xl font-semibold">
                      {course.title}
                    </h2>
                    <Badge
                      variant="outline"
                      className="mb-2 border-primary text-primary"
                    >
                      {course.category.name}
                    </Badge>
                    <p
                      className="hidden text-center text-xl md:block"
                      style={{
                        maxWidth: "600px",
                        wordWrap: "break-word",
                      }}
                    >
                      {course.description}
                    </p>
                    <p className="hidden text-xl font-bold md:block">
                      Educador: {course.instructor}
                    </p>
                    <p className="hidden text-xl text-red-500 md:block">
                      {course.modalidad.name}
                    </p>
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500" />
                      <span className="ml-1 text-sm text-yellow-500">
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
                  className={`h-3 w-3 rounded-full ${
                    index === carouselIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Search Bar Below Carousel */}
          <div className="flex justify-end">
            <form className="flex max-w-lg items-center">
              <div className="mr-4 flex h-full items-center">
                <RocketLaunchIcon className="size-6 h-6 w-6 text-gray-500 dark:text-gray-400" />
                <span className="ml-2 whitespace-nowrap text-xl text-gray-500 dark:text-gray-400">
                  IA
                </span>
              </div>

              <div className="relative w-full max-w-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  required
                  placeholder="Buscar..."
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary dark:focus:ring-primary"
                  type="text"
                />
              </div>
              <button
                className="ml-2 inline-flex items-center rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm font-medium text-background hover:bg-primary/90 hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/50 dark:bg-primary dark:hover:bg-primary/90 dark:focus:ring-primary/50"
                type="submit"
              >
                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                Buscar
              </button>
            </form>
          </div>

          <CourseCategories />

          {/* Carousel Pequeño */}
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
                        className="mx-4 ml-2 h-48 w-full rounded-lg md:h-64"
                      />
                    ))
                  : courses.map((course) => (
                      <CarouselItem
                        key={course.id}
                        className="pl-4 zoom-in md:basis-1/2 lg:basis-1/3"
                      >
                        <div className="relative h-48 w-full md:h-64">
                          <AspectRatio ratio={16 / 9}>
                            <Image
                              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                              alt={course.title}
                              fill
                              className="object-cover"
                              priority
                              quality={100}
                            />
                          </AspectRatio>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                            <h3 className="text-lg font-bold text-white">
                              {course.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className="mb-2 border-primary bg-background text-primary hover:bg-black hover:bg-opacity-90"
                            >
                              {course.category.name}
                            </Badge>
                            <div className="flex w-full justify-between">
                              <p className="italic text-primary">
                                Educador:{" "}
                                <span className="underline">
                                  {course.instructor}
                                </span>
                              </p>
                              <p className="text-primary">
                                <span className="text-red-500">
                                  {course.modalidad.name}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center">
                              <StarIcon className="h-5 w-5 text-yellow-500" />
                              <span className="ml-1 text-sm font-bold text-yellow-500">
                                {(course.rating ?? 0).toFixed(1)}
                              </span>
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

          {/* Search Bar Above Cursos Disponibles */}
          <div className="flex justify-end">
            <form className="flex max-w-lg items-center">
              <div className="mr-4 flex h-full items-center">
                <AcademicCapIcon className="size-5 h-6 w-6 text-gray-500 dark:text-gray-400" />
                <span className="ml-2 whitespace-nowrap text-xl text-gray-500 dark:text-gray-400">
                  Busca Tu Curso
                </span>{" "}
              </div>
              <label className="sr-only" htmlFor="course-search">
                Buscar...
              </label>
              <div className="relative w-full max-w-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  required
                  placeholder="Search..."
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary dark:focus:ring-primary"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <button
                className="ml-2 inline-flex items-center rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm font-medium text-background hover:bg-primary/90 hover:text-primary focus:outline-none focus:ring-4 focus:ring-primary/50 dark:bg-primary dark:hover:bg-primary/90 dark:focus:ring-primary/50"
                type="submit"
              >
                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                Buscar
              </button>
            </form>
          </div>
          <h2 className="text-3xl font-bold">Cursos Disponibles</h2>
          {loading && <LoadingCourses />}
          <Suspense fallback={<LoadingCourses />}>
            <CourseListStudent courses={paginatedCourses} />
          </Suspense>

          <Pagination className="pb-8">
            <PaginationContent className="cursor-pointer">
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
      </main>
      <Footer />
    </div>
  );
}
