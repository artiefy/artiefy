//src\app\estudiantes\cursos\[id]\CourseDetails.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  FaCalendar,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaHome,
  FaStar,
  FaUserGraduate,
} from 'react-icons/fa';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/estudiantes/ui/breadcrumb';
import { Button } from '~/components/estudiantes/ui/button';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';

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
  modalidad: {
    name: string;
  };
  lessons: {
    id: number;
    title: string;
    duration: number;
    description: string | null;
  }[];
}

export default function CourseDetails({ course }: { course: Course }) {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // Adjust the delay as needed

    return () => clearTimeout(timer);
  }, []);

  const toggleLesson = (lessonId: number) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const formatDate = (dateString: string | number | Date) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
        <Breadcrumb className="pb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <FaHome className="mr-1 inline-block" /> Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/estudiantes/">
                <FaUserGraduate className="mr-1 inline-block" /> Cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{course.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {loading ? (
          <Skeleton className="h-[500px] w-full rounded-lg" />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-lg">
            {/* Course Header */}
            <div className="relative h-72 overflow-hidden">
              <Image
                src={
                  course.coverImageKey
                    ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
                    : 'https://placehold.co/600x400/EEE/31343C?font=montserrat&text=Curso-Artiefy'
                }
                alt={course.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h1 className="text-3xl font-bold text-white">
                  {course.title}
                </h1>
              </div>
            </div>

            {/* Course Info */}
            <div className="flex flex-wrap gap-6 p-6">
              <div className="flex-1">
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
                          className={`size-5 ${index < Math.floor(course.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`}
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
                    {course.description ?? 'No hay descripción disponible.'}
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
                              {lesson.duration} mins
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
                                'No hay descripción disponible para esta lección.'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full justify-center border-white/20 bg-background text-lg font-semibold text-primary transition-colors hover:bg-background active:scale-95">
                  Inscribirse
                </Button>
              </div>

              {/* Chatbot Component */}
              <div className="max-w-md overflow-hidden rounded-lg bg-white shadow-md dark:bg-zinc-800">
                <div className="flex h-[400px] flex-col">
                  <div className="border-b px-4 py-3 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">
                        Chatbot Assistant
                      </h2>
                      <div className="rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                        Online
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex flex-1 flex-col space-y-2 overflow-y-auto p-3"
                    id="chatDisplay"
                  >
                    <div className="max-w-xs self-end rounded-lg bg-secondary px-3 py-1.5 text-sm text-white">
                      Hello! How can I assist you today?
                    </div>
                    <div className="max-w-xs self-start rounded-lg bg-zinc-500 px-3 py-1.5 text-sm text-white">
                      Hello! I need a Chatbot!
                    </div>
                  </div>
                  <div className="border-t px-3 py-2 dark:border-zinc-700">
                    <div className="flex gap-2">
                      <input
                        placeholder="Type your message..."
                        className="flex-1 rounded-lg border p-2 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                        id="chatInput"
                        type="text"
                      />
                      <Button className="inline-flex items-center justify-center overflow-hidden rounded-md border border-primary bg-background p-2 text-primary transition duration-300 ease-in-out hover:bg-secondary hover:text-background active:scale-95">
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
