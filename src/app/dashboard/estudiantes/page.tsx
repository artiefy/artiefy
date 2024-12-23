"use client";

import { StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { useEffect, useState } from "react";
import CourseCategories from "~/components/layout/CourseCategories";
import CourseListStudent from "~/components/layout/CourseListStudent";
import Footer from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { type Course } from "~/types";

const ITEMS_PER_PAGE = 6;

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
      course.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCourses(filtered);
    setCurrentPage(1);
  };

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCarouselChange = (index: number) => {
    setCarouselIndex(index);
  };

  useEffect(() => {
    void fetchCourses();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prevIndex) => (prevIndex + 1) % Math.min(courses.length, 5));
    }, 5000);
    return () => clearInterval(interval);
  }, [courses]);

  return (
    <div>
      <main className="container mx-auto px-12 md:px-16">
        <Header />
        <div className="flex flex-col space-y-12">
          {/* Carousel */}
          <div className="relative h-[500px] overflow-hidden">
            {courses.slice(0, 5).map((course, index) => (
              <div
                key={course.id}
                className={`absolute w-full h-full transition-opacity duration-500 ${
                  index === carouselIndex ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-primary">
                  <h2 className="text-4xl font-semibold mb-4">{course.title}</h2>
                  <Badge variant="outline" className="mb-2 border-primary text-primary">
                    {course.category}
                  </Badge>
                  <p className="text-xl hidden md:block">{course.description}</p>
                  <p className="text-xl hidden md:block">Instructor: {course.instructor}</p>
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
                  className={`w-3 h-3 rounded-full ${
                    index === carouselIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          <CourseCategories />
          <div>
            <h2 className="text-3xl font-bold mb-6">Buscar Cursos</h2>
            <Input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <h2 className="text-3xl font-bold">Cursos Disponibles</h2>
          <CourseListStudent courses={paginatedCourses} />

          <Pagination className="pb-10">
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationPrevious onClick={() => setCurrentPage(currentPage - 1)} />
              )}
              {Array.from({ length: totalPages }, (_, index) => (
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
                <PaginationNext onClick={() => setCurrentPage(currentPage + 1)} />
              )}
            </PaginationContent>
          </Pagination>
        </div>
      </main>
      <Footer />
    </div>
  );
}
