import React, { useState } from 'react';
import Image from 'next/image';
import {
  FaCalendar,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaStar,
  FaUserGraduate,
} from 'react-icons/fa';
import { Button } from '~/components/admin/ui/button';
import { ScrollArea } from '~/components/admin/ui/scroll-area';
import type { Course } from '~/types/course';

interface CourseDetailsProps {
  course: Course;
}

export function CourseDetails({ course }: CourseDetailsProps) {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  const toggleLesson = (lessonId: number) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <ScrollArea className="h-[80vh] w-full">
      <div className="space-y-6 p-4">
        <div className="relative h-48 overflow-hidden rounded-xl sm:h-64 md:h-72">
          <Image
            src={
              course.coverImageKey
                ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
                : '/placeholder.jpg'
            }
            alt={course.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {course.instructor}
            </h3>
            <p className="text-sm text-muted-foreground">Instructor</p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0">
            <div className="flex items-center">
              <FaUserGraduate className="mr-2 text-primary" />
              <span className="text-sm text-foreground sm:text-base">
                {course.totalStudents} Estudiantes
              </span>
            </div>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, index) => (
                <FaStar
                  key={index}
                  className={`size-4 sm:size-5 ${index < Math.floor(course.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="ml-2 text-base font-semibold text-yellow-400 sm:text-lg">
                {course.rating?.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="prose max-w-none">
          <p className="text-sm leading-relaxed text-foreground sm:text-base">
            {course.description ?? 'No hay descripción disponible.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground sm:text-sm">
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
          <h2 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">
            Contenido del curso
          </h2>
          <div className="space-y-4">
            {course.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="overflow-hidden rounded-lg border bg-card transition-colors hover:bg-accent"
              >
                <button
                  className="flex w-full items-center justify-between p-4 sm:px-6"
                  onClick={() => toggleLesson(lesson.id)}
                >
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-foreground sm:text-base">
                      {lesson.title}
                    </span>
                    <span className="ml-4 text-xs text-muted-foreground sm:text-sm">
                      {lesson.duration} mins
                    </span>
                  </div>
                  {expandedLesson === lesson.id ? (
                    <FaChevronUp className="text-muted-foreground" />
                  ) : (
                    <FaChevronDown className="text-muted-foreground" />
                  )}
                </button>
                {expandedLesson === lesson.id && (
                  <div className="border-t bg-background p-4 sm:px-6">
                    <p className="text-sm text-foreground sm:text-base">
                      {lesson.description ??
                        'No hay descripción disponible para esta lección.'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <Button className="mt-6 w-full justify-center bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 sm:text-lg">
          Inscribirse
        </Button>
      </div>
    </ScrollArea>
  );
}
