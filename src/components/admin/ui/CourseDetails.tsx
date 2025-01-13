import React, { useState } from 'react';
import Image from "next/image";
import { FaCalendar, FaChevronDown, FaChevronUp, FaClock, FaStar, FaUserGraduate } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import type { Course } from '~/types/course';
import { ScrollArea } from "~/components/ui/scroll-area";

interface CourseDetailsProps {
  course: Course;
}

export function CourseDetails({ course }: CourseDetailsProps) {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  const toggleLesson = (lessonId: number) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  return (
    <ScrollArea className="h-[80vh] w-full">
      <div className="p-4 space-y-6">
        <div className="relative h-48 sm:h-64 md:h-72 rounded-xl overflow-hidden">
          <Image
            src={course.coverImageKey ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}` : "/placeholder.jpg"}
            alt={course.title}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{course.title}</h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{course.instructor}</h3>
            <p className="text-sm text-muted-foreground">Instructor</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center">
              <FaUserGraduate className="mr-2 text-primary" />
              <span className="text-sm sm:text-base text-foreground">{course.totalStudents} Estudiantes</span>
            </div>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, index) => (
                <FaStar
                  key={index}
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${index < Math.floor(course.rating ?? 0) ? "text-yellow-400" : "text-gray-300"}`}
                />
              ))}
              <span className="ml-2 text-base sm:text-lg font-semibold text-yellow-400">
                {course.rating?.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <p className="text-sm sm:text-base leading-relaxed text-foreground">
            {course.description ?? "No hay descripción disponible."}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center">
            <FaCalendar className="mr-2" />
            <span>Creado: {formatDate(course.createdAt)}</span>
          </div>
          <div className="flex items-center">
            <FaClock className="mr-2" />
            <span>Última actualización: {formatDate(course.updatedAt)}</span>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-6 text-xl sm:text-2xl font-bold text-foreground">Contenido del curso</h2>
          <div className="space-y-4">
            {course.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent"
              >
                <button
                  className="flex w-full items-center justify-between px-4 sm:px-6 py-4"
                  onClick={() => toggleLesson(lesson.id)}
                >
                  <div className="flex items-center">
                    <span className="font-medium text-foreground text-sm sm:text-base">{lesson.title}</span>
                    <span className="ml-4 text-xs sm:text-sm text-muted-foreground">{lesson.duration} mins</span>
                  </div>
                  {expandedLesson === lesson.id ? (
                    <FaChevronUp className="text-muted-foreground" />
                  ) : (
                    <FaChevronDown className="text-muted-foreground" />
                  )}
                </button>
                {expandedLesson === lesson.id && (
                  <div className="border-t bg-background px-4 sm:px-6 py-4">
                    <p className="text-sm sm:text-base text-foreground">
                      {lesson.description ?? "No hay descripción disponible para esta lección."}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <Button className="w-full mt-6 transform justify-center bg-primary text-primary-foreground text-base sm:text-lg font-semibold transition-colors hover:bg-primary/90 active:scale-95">
          Inscribirse
        </Button>
      </div>
    </ScrollArea>
  );
}

