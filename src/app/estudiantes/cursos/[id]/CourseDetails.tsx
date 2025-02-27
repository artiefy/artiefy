'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { CourseBreadcrumb } from '~/components/estudiantes/layout/coursedetail/CourseBreadcrumb';
import CourseChatbot from '~/components/estudiantes/layout/coursedetail/CourseChatbot';
import CourseComments from '~/components/estudiantes/layout/coursedetail/CourseComments';
import { CourseHeader } from '~/components/estudiantes/layout/coursedetail/CourseHeader';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';
import { enrollInCourse } from '~/server/actions/estudiantes/courses/enrollInCourse';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { unenrollFromCourse } from '~/server/actions/estudiantes/courses/unenrollFromCourse';
import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
import type { Course, Enrollment } from '~/types';

export default function CourseDetails({
  course: initialCourse,
}: {
  course: Course;
}) {
  const [course, setCourse] = useState<Course>(initialCourse);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState(course.totalStudents);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);

  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const errorMessages = {
    enrollment: {
      title: 'Error de inscripción',
      description: 'No se pudo completar la inscripción',
    },
    unenrollment: {
      title: 'Error al cancelar inscripción',
      description: 'No se pudo cancelar la inscripción',
    },
  } as const;

  useEffect(() => {
    const checkEnrollmentAndProgress = async () => {
      if (userId) {
        // Verificar estado de suscripción primero
        const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
        console.log('Subscription Status:', subscriptionStatus); // Debug log

        // Actualizar estado de suscripción
        setIsSubscriptionActive(subscriptionStatus === 'active');

        // Verificar inscripción
        const isUserEnrolled =
          Array.isArray(course.enrollments) &&
          course.enrollments.some(
            (enrollment: Enrollment) => enrollment.userId === userId
          );

        setIsEnrolled(isUserEnrolled);

        // Si está inscrito, cargar progreso
        if (isUserEnrolled) {
          try {
            const lessons = await getLessonsByCourseId(course.id);
            setCourse((prev) => ({
              ...prev,
              lessons: lessons
                .map((lesson, index) => ({
                  ...lesson,
                  isLocked: lesson.userProgress === 0 && index !== 0,
                  porcentajecompletado: lesson.userProgress,
                }))
                .sort((a, b) => a.title.localeCompare(b.title)),
            }));
          } catch (error) {
            console.error('Error cargando progreso:', error);
          }
        }
      }
    };

    void checkEnrollmentAndProgress();
  }, [course.enrollments, course.id, userId, user]);

  const handleEnroll = async () => {
    if (!isSignedIn) {
      toast.error('Debes iniciar sesión');
      void router.push(`/sign-in?redirect_url=${pathname}`);
      return;
    }

    if (isEnrolling) return;

    setIsEnrolling(true);
    setEnrollmentError(null);

    try {
      // Verificar suscripción activa
      const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;

      // Debug logs
      console.log('Current subscription status:', subscriptionStatus);
      console.log('Is subscription active:', isSubscriptionActive);

      if (subscriptionStatus !== 'active') {
        toast.error('Suscripción requerida', {
          description: 'Necesitas una suscripción activa para inscribirte.',
        });
        void router.push('/planes');
        return;
      }

      const result = await enrollInCourse(course.id);

      if (result.success) {
        setTotalStudents((prev) => prev + 1);
        setIsEnrolled(true);
        toast.success('¡Te has inscrito exitosamente!');

        // Actualizar curso
        const updatedCourse = await getCourseById(course.id);
        if (updatedCourse) {
          setCourse({
            ...updatedCourse,
            lessons: updatedCourse.lessons ?? [],
          });
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      handleError(error, 'enrollment');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!isSignedIn || isUnenrolling) return;

    setIsUnenrolling(true);
    setEnrollmentError(null);

    try {
      await unenrollFromCourse(course.id);
      setTotalStudents((prev) => prev - 1);
      setIsEnrolled(false);
      const updatedCourse = await getCourseById(course.id);
      if (updatedCourse) {
        setCourse({
          ...updatedCourse,
          lessons: updatedCourse.lessons ?? [],
        });
      }
      toast.success('Has cancelado tu inscripción al curso correctamente');
    } catch (error: unknown) {
      handleError(error, 'unenrollment');
    } finally {
      setIsUnenrolling(false);
    }
  };

  const handleError = (
    error: unknown,
    errorType: keyof typeof errorMessages
  ) => {
    const message = errorMessages[errorType];
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';

    setEnrollmentError(errorMessage);
    toast.error(`${message.description}: ${errorMessage}`);
    console.error(`${message.title}:`, error);
  };

  const handleEnrollmentChange = (enrolled: boolean) => {
    setIsEnrolled(enrolled);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl pb-4 md:pb-6 lg:pb-8">
        <CourseBreadcrumb title={course.title} />

        {!course.lessons ? (
          <Skeleton className="h-[500px] w-full rounded-lg" />
        ) : (
          <>
            <CourseHeader
              course={course}
              totalStudents={totalStudents}
              isEnrolled={isEnrolled}
              isEnrolling={isEnrolling}
              isUnenrolling={isUnenrolling}
              isSubscriptionActive={isSubscriptionActive}
              onEnroll={handleEnroll}
              onUnenroll={handleUnenroll}
            />

            {/* Mostrar mensajes de error si existen */}
            {enrollmentError && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                {/* ...error message content... */}
              </div>
            )}

            {/* Siempre mostrar comentarios y chatbot */}
            <div className="mt-8 space-y-8">
              <CourseComments
                courseId={course.id}
                isEnrolled={isEnrolled}
                onEnrollmentChange={handleEnrollmentChange}
              />
              <CourseChatbot isEnrolled={isEnrolled} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}