"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import CourseCategories from "~/components/layout/CourseCategories";
import CourseListStudent from "~/components/layout/CourseListStudent";
import Footer from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { Badge } from "~/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
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
import { getAllCourses } from "~/models/courseModels";

interface Course {
  id: number;
  title: string;
  description: string | null;
  coverImageKey: string | null;
  creatorId: string;
  category: string;
  instructor: string;
  rating: number | null;
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage,
  );

  useEffect(() => {
    const fetchCourses = async () => {
      const allCourses = await getAllCourses();
      setCourses(allCourses);
      setFilteredCourses(allCourses);
    };
    fetchCourses().catch((error) =>
      console.error("Error fetching courses:", error),
    );
  }, []);

  useEffect(() => {
    const filtered = courses.filter((course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        (prevIndex + 1) % Math.min(courses.length, 5)
      );
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [courses]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div>
      <main className="container mx-auto pl-12 pr-12 md:px-16">
        <Header />
        <div className="flex flex-col space-y-12">
          {/* Carousel Grande */}
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {courses.slice(0, 5).map((course, index) => (
                  <CarouselItem
                    key={course.id}
                    className={`basis-full ${
                      index === currentIndex ? "block" : "hidden"
                    } cursor-pointer hover:brightness-90`}
                  >
                    <div className="relative h-64 w-full md:h-96">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                        alt={course.title}
                        fill
                        className="object-cover"
                        priority
                        quality={100}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4 text-white">
                        <h2 className="text-xl text-primary md:text-2xl">
                          {course.title}
                        </h2>
                        <Badge
                          variant="outline"
                          className="mb-2 border-primary bg-background text-primary"
                        >
                          {course.category}
                        </Badge>
                        <p className="hidden text-primary md:block">
                          {course.description}
                        </p>
                        <p className="hidden text-primary md:block">
                          Instructor: {course.instructor}
                        </p>
                        <span className="ml-1 text-sm text-gray-600">{(course.rating ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
              {courses.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  className={`h-3 w-3 rounded-full ${
                    index === currentIndex ? "bg-white" : "bg-gray-400"
                  }`}
                  onClick={() => handleDotClick(index)}
                />
              ))}
            </div>
          </div>
          
          <CourseCategories />
          {/* Carousel Pequeño */}
          <div className="relative">
            <h2 className="mb-12 text-center text-3xl font-bold">Top Cursos</h2>
            <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {courses.map((course) => (
                  <CarouselItem
                    key={course.id}
                    className="pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <div className="relative h-48 w-full md:h-64">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                        alt={course.title}
                        fill
                        className="object-cover"
                        priority
                        quality={100}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                        <h3 className="text-lg text-primary">{course.title}</h3>
                        <Badge
                          variant="outline"
                          className="mb-2 border-primary bg-background text-primary hover:bg-black hover:bg-opacity-90"
                        >
                          {course.category}
                        </Badge>
                        <p className="text-primary">
                          Instructor: {course.instructor}
                        </p>
                        <span className="ml-1 text-sm text-gray-600">{(course.rating ?? 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
          {/* Search Bar */}
          <div className="my-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Buscar Cursos
            </h2>
            <Input
              type="text"
              placeholder="Buscar Cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </div>
          {/* Course List */}
          <div>
            <h2 className="mb-12 text-3xl font-bold">Cursos Disponibles</h2>
            <CourseListStudent courses={paginatedCourses} />
            <Pagination className="py-4">
              <PaginationContent>
                <PaginationItem>
                  {currentPage > 1 && (
                    <PaginationPrevious
                      href="#"
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                  )}
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      className="border-primary text-primary"
                      href="#"
                      isActive={currentPage === index + 1}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  {currentPage < totalPages && (
                    <PaginationNext
                      href="#"
                      onClick={() => handlePageChange(currentPage + 1)}
                    />
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

