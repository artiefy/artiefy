//src\app\dashboard\estudiantes\page.tsx

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import CourseListStudent from "~/components/layout/CourseListStudent";
import { Header } from "~/components/layout/Header";
import { Badge } from "~/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { Input } from "~/components/ui/input";
import { getAllCourses } from "~/models/courseModels";

interface Course {
  id: number;
  title: string;
  description: string | null;
  coverImageKey: string | null;
  creatorId: string;
  category: string;
  instructor: string;
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

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
      setCurrentIndex(
        (prevIndex) => (prevIndex + 1) % courses.slice(0, 5).length,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [courses]);

  return (
    <div className="px-12">
      <main className="container mx-auto pl-12 pr-12 md:px-16">
        <Header />
        <div className="flex flex-col space-y-12">
          {/* Carousel Grande */}
          <div className="relative">
            <h2 className="text-xl md:text-2xl text-primary">Featured Courses</h2>
            <Carousel className="w-full">
              <CarouselContent>
                {courses.slice(0, 5).map((course, _index) => (
                  <CarouselItem key={course.id} className="basis-full">
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
                        <h2 className="text-xl md:text-2xl text-primary">
                          {course.title}
                        </h2>
                        <Badge
                          variant="outline"
                          className="mb-2 border-primary bg-background text-primary"
                        >
                          {course.category}
                        </Badge>
                        <p className="hidden md:block text-primary">
                          {course.description}
                        </p>
                        <p className="hidden md:block text-primary">
                          Instructor: {course.instructor}
                        </p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="flex h-12 w-12 items-center justify-center rounded-full bg-black bg-opacity-50 text-white" />
              <CarouselNext className="flex h-12 w-12 items-center justify-center rounded-full bg-black bg-opacity-50 text-white" />
            </Carousel>
            <div className="absolute bottom-0 left-0 right-0 flex justify-center p-2">
              {courses.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  className={`mx-1 h-3 w-3 rounded-full ${index === currentIndex ? "bg-white" : "bg-gray-400"}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
          {/* Carousel Pequeño */}
          <div className="relative">
            <h2 className="text-xl md:text-2xl text-primary">All Courses</h2>
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
                        <p className="text-primary">Instructor: {course.instructor}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="flex h-12 w-12 items-center justify-center rounded-full bg-black bg-opacity-50 text-white" />
              <CarouselNext className="flex h-12 w-12 items-center justify-center rounded-full bg-black bg-opacity-50 text-white" />
            </Carousel>
          </div>
          {/* Search Bar */}
          <div className="my-4">
            <h2 className="text-xl md:text-2xl text-primary">Search Courses</h2>
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </div>
          {/* Course List */}
          <div>
            <h2 className="text-xl md:text-2xl text-primary">Course List</h2>
            <CourseListStudent courses={filteredCourses} />
          </div>
        </div>
      </main>
    </div>
  );
}