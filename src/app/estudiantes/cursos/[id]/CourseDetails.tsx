'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  FaCalendar,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaHome,
  FaUserGraduate,
  FaLock,
} from 'react-icons/fa';
import { StarIcon } from '@heroicons/react/24/solid';
import ChatbotModal from '~/components/estudiantes/layout/ChatbotModal';
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
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '~/components/estudiantes/ui/card';
import { enrollInCourse } from '~/server/actions/studentActions';

interface Enrollment {
  id: number;
  userId: string;
  courseId: number;
  enrolledAt: Date;
  completed: boolean;
}

export interface Course {
  id: number;
  title: string;
  coverImageKey: string | null;
  category?: {
    id: number;
    name: string;
  };
  description: string | null;
  instructor: string;
  rating: number | null;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  totalStudents: number;
  modalidad?: {
    name: string;
  };
  lessons: {
    id: number;
    title: string;
    duration: number;
    description: string | null;
    coverVideoKey: string;
    resourceKey: string;
    porcentajecompletado: number;
    order: number;
  }[];
  enrollments?: Enrollment[] | { length: number };
}

export default function CourseDetails({ course }: { course: Course }) {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState(course.totalStudents);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Verificar si el usuario está inscrito
    if (Array.isArray(course.enrollments) && userId) {
      setIsEnrolled(course.enrollments.some((enrollment: Enrollment) => enrollment.userId === userId));
    }

    return () => clearTimeout(timer);
  }, [course.enrollments, userId]);

  const toggleLesson = (lessonId: number) => {
    if (isEnrolled) {
      setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
    }
  };

  const formatDate = (dateString: string | number | Date) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleEnroll = async () => {
    if (!isSignedIn || !userId) {
      router.push('/sign-in');
      return;
    }

    setIsEnrolling(true);
    setEnrollmentError(null);

    try {
      await enrollInCourse(course.id, userId);
      setTotalStudents(prevTotal => prevTotal + 1);
      setIsEnrolled(true);
    } catch (error) {
      setEnrollmentError('Error al inscribirse en el curso. Por favor, inténtelo de nuevo.');
      console.error('Error al inscribirse:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsEnrolling(false);
    }
  };

  // Ordenar las lecciones por el campo 'order'
  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);

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
              <BreadcrumbLink href="/estudiantes/cursos">
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
          <Card className="overflow-hidden">
            <CardHeader className="p-0">
              <AspectRatio ratio={16 / 6}>
                <Image
                  src={course.coverImageKey ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd() : '/placeholder.jpg'}
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
              </AspectRatio>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-background">
                    {course.instructor}
                  </h3>
                  <p className="text-gray-600">Instructor</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <FaUserGraduate className="mr-2 text-blue-600" />
                    <span className="text-background">
                      {totalStudents} Estudiantes
                    </span>
                  </div>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <StarIcon
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

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Badge 
                    variant="outline" 
                    className="border-primary bg-background text-primary hover:bg-black/70"
                  >
                    {course.category?.name}
                  </Badge>
                  <div className="flex items-center">
                    <FaCalendar className="mr-2 text-gray-600" />
                    <span className="text-sm text-gray-600">Creado: {formatDate(course.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="mr-2 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Última actualización: {formatDate(course.updatedAt)}
                    </span>
                  </div>
                </div>
                <Badge className="bg-red-500 text-white">
                  {course.modalidad?.name}
                </Badge>
              </div>

              <div className="prose max-w-none">
                <p className="leading-relaxed text-gray-700">
                  {course.description ?? 'No hay descripción disponible.'}
                </p>
              </div>

              <div>
                <h2 className="mb-4 text-2xl font-bold text-background">
                  Contenido del curso
                </h2>
                <div className="space-y-4">
                  {sortedLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="overflow-hidden rounded-lg border bg-gray-50 transition-colors hover:bg-gray-100"
                    >
                      <button
                        className="flex w-full items-center justify-between px-6 py-4"
                        onClick={() => toggleLesson(lesson.id)}
                        disabled={!isEnrolled}
                      >
                        <div className="flex items-center">
                          <span className="font-medium text-background">
                            Lección {lesson.order}: {lesson.title}
                          </span>
                          <span className="ml-4 text-sm text-gray-500">
                            {lesson.duration} mins
                          </span>
                        </div>
                        {isEnrolled ? (
                          expandedLesson === lesson.id ? (
                            <FaChevronUp className="text-gray-400" />
                          ) : (
                            <FaChevronDown className="text-gray-400" />
                          )
                        ) : (
                          <FaLock className="text-gray-400" />
                        )}
                      </button>
                      {expandedLesson === lesson.id && isEnrolled && (
                        <div className="border-t bg-white px-6 py-4">
                          <p className="text-gray-700">
                            {lesson.description ??
                              'No hay descripción disponible para esta lección.'}
                          </p>
                          <p className="text-gray-700">
                            Resource Key: {lesson.resourceKey}
                          </p>
                          <p className="text-gray-700">
                            Porcentaje Completado:{' '}
                            {lesson.porcentajecompletado}%
                          </p>
                          <Button
                            asChild
                            className="mt-4 text-background hover:underline active:scale-95"
                          >
                            <Link href={`/estudiantes/clases/${lesson.id}`}>
                              Ver Clase
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              {!isEnrolled && (
                <Button
                  className="w-full justify-center border-white/20 bg-background text-lg font-semibold text-primary transition-colors hover:bg-background active:scale-95"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? 'Inscribiendo...' : 'Inscribirse al curso'}
                </Button>
              )}
              <ChatbotModal />
            </CardFooter>
          </Card>
        )}
        {enrollmentError && <p className="mt-2 text-red-500">{enrollmentError}</p>}
      </main>
      <Footer />
    </div>
  );
}

