"use client";

import { Suspense, useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import CourseCategories from "~/components/layout/CourseCategories";
import CourseListStudent from "~/components/layout/CourseListStudent";
import Footer from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Badge } from "~/components/ui/badge";
import { SkeletonCard } from "~/components/layout/SkeletonCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { Input } from "~/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

const ITEMS_PER_PAGE = 9;

interface Course {
  id: string;
  title: string;
  coverImageKey: string;
  category: string;
  description: string;
  instructor: string;
  rating?: number;
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

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (!response.ok) throw new Error(response.statusText);
      const data = (await response.json()) as Course[];
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      console.error("Error al obtener los cursos:", error);
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
        <div className="flex flex-col space-y-12">
          {/* Carousel */}
          <div className="relative h-[500px] overflow-hidden">
            {courses.slice(0, 5).map((course, index) => (
              <div
                key={course.id}
                className={`absolute h-full w-full transition-opacity duration-500 ${
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
                    {course.category}
                  </Badge>
                  <p className="hidden text-xl md:block">
                    {course.description}
                  </p>
                  <p className="hidden text-xl md:block">
                    Instructor: {course.instructor}
                  </p>
                  <div className="flex items-center">
                    <StarIcon className="h-5 w-5 text-yellow-500" />
                    <span className="ml-1 text-sm text-yellow-500">
                      {(course.rating ?? 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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

          <CourseCategories />

          {/* Carousel Pequeño */}
          <div className="relative">
            <h2 className="text-xl text-primary md:text-2xl">Top Cursos</h2>
            <Carousel className="w-full p-4">
              <CarouselContent className="-ml-4">
                {courses.map((course) => (
                  <CarouselItem
                    key={course.id}
                    className="pl-4 md:basis-1/2 lg:basis-1/3"
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
                        <h3 className="text-lg text-primary">{course.title}</h3>
                        <Badge
                          variant="outline"
                          className="mb-2 border-primary bg-background text-primary hover:bg-black hover:bg-opacity-90"
                        >
                          {course.category}
                        </Badge>
                        <p className="text-primary italic">
                          Instructor: <span className=" underline">{course.instructor}</span>
                        </p>
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

          <div>
            <h2 className="text-xl text-primary md:text-2xl">Buscar Cursos</h2>
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <h2 className="text-3xl font-bold">Cursos Disponibles</h2>
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
              {Array.from({ length: totalPages }, (_, index) => (
                <PaginationItem key={index} >
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
