"use client"

import Image from "next/image";
import { useState } from "react";
import {
  FaCalendar,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaStar,
  FaUserGraduate,
  FaHome,
} from "react-icons/fa";
import Footer from "~/components/layout/Footer";
import { Header } from "~/components/layout/Header";
import { Button } from "~/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

export interface Course {
  id: number;
  title: string;
  coverImageKey: string | null;
  category: {
    id: number;
    name: string;
  };
  description: string | null;
  instructor: string;
  rating: number | null;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  totalStudents: number;
  lessons: {
    id: number;
    title: string;
    duration: number;
    description: string | null;
  }[];
}

export default function CourseDetails({ course }: { course: Course }) {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  const toggleLesson = (lessonId: number) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const formatDate = (dateString: string | number | Date) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
        <Breadcrumb className="pb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <FaHome className="inline-block mr-1" /> Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/estudiantes/">
              <FaUserGraduate className="inline-block mr-1" /> Cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{course.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {/* Course Header */}
          <div className="relative h-72 overflow-hidden">
            <Image
              src={
                course.coverImageKey
                  ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
                  : "/placeholder.jpg"
              }
              alt={course.title}
              fill
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <h1 className="text-3xl font-bold text-white">{course.title}</h1>
            </div>
          </div>

          {/* Course Info */}
          <div className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-lg font-semibold text-background">
                    {course.instructor}
                  </h3>
                  <p className="text-gray-600">Instructor</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <FaUserGraduate className="mr-2 text-blue-600" />
                  <span className="text-background">
                    {course.totalStudents} Estudiantes
                  </span>
                </div>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <FaStar
                      key={index}
                      className={`h-5 w-5 ${index < Math.floor(course.rating ?? 0) ? "text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                  <span className="ml-2 text-lg font-semibold text-yellow-400">
                    {course.rating?.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="prose mb-8 max-w-none">
              <p className="leading-relaxed text-gray-700">
                {course.description ?? "No hay descripción disponible."}
              </p>
            </div>

            <div className="mb-8 flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <FaCalendar className="mr-2" />
                <span>Creado: {formatDate(course.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <FaClock className="mr-2" />
                <span>
                  Última actualización: {formatDate(course.updatedAt)}
                </span>
              </div>
            </div>

            {/* Lessons */}
            <div className="mt-8 p-4">
              <h2 className="mb-6 text-2xl font-bold text-background">
                Contenido del curso
              </h2>
              <div className="space-y-4">
                {course.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="overflow-hidden rounded-lg border bg-gray-50 transition-colors hover:bg-gray-100"
                  >
                    <button
                      className="flex w-full items-center justify-between px-6 py-4"
                      onClick={() => toggleLesson(lesson.id)}
                    >
                      <div className="flex items-center">
                        <span className="font-medium text-background">
                          {lesson.title}
                        </span>
                        <span className="ml-4 text-sm text-gray-500">
                          {lesson.duration} hrs
                        </span>
                      </div>
                      {expandedLesson === lesson.id ? (
                        <FaChevronUp className="text-gray-400" />
                      ) : (
                        <FaChevronDown className="text-gray-400" />
                      )}
                    </button>
                    {expandedLesson === lesson.id && (
                      <div className="border-t bg-white px-6 py-4">
                        <p className="text-gray-700">
                          {lesson.description ??
                            "No hay descripción disponible para esta lección."}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full transform justify-center border-background bg-[#00BDD8] text-lg font-semibold text-white transition-colors hover:bg-background active:scale-95">
              Inscribirse
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}