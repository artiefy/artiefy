'use client';

import { useEffect, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import { CourseBreadcrumb } from '~/components/estudiantes/layout/coursedetail/CourseBreadcrumb';
import CourseComments from '~/components/estudiantes/layout/coursedetail/CourseComments';
import { CourseDetailsSkeleton } from '~/components/estudiantes/layout/coursedetail/CourseDetailsSkeleton';
import { CourseHeader } from '~/components/estudiantes/layout/coursedetail/CourseHeader';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
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
  const [totalStudents, setTotalStudents] = useState(course.totalStudents);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);

  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!initialCourse.isActive) {
      toast.error('Curso no disponible', {
        description: 'Este curso no está disponible actualmente.',
        duration: 2000,
        id: 'course-unavailable', // Previene toasts duplicados
      });
      router.replace('/estudiantes');
    }
  }, [initialCourse.isActive, router]);

  useEffect(() => {
    const checkEnrollmentAndProgress = async () => {
      setIsCheckingEnrollment(true);
      try {
        if (userId) {
          // Verificar inscripción primero
          const isUserEnrolled =
            Array.isArray(initialCourse.enrollments) &&
            initialCourse.enrollments.some(
              (enrollment: Enrollment) => enrollment.userId === userId
            );
          setIsEnrolled(isUserEnrolled);

          // Verificar suscripción
          const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
          const subscriptionEndDate = user?.publicMetadata
            ?.subscriptionEndDate as string | null;
          const isSubscriptionActive =
            subscriptionStatus === 'active' &&
            (!subscriptionEndDate ||
              new Date(subscriptionEndDate) > new Date());
          setIsSubscriptionActive(isSubscriptionActive);

          // Si está inscrito, cargar progreso real desde la BD
          if (isUserEnrolled) {
            const lessons = await getLessonsByCourseId(
              initialCourse.id,
              userId
            );
            if (lessons) {
              setCourse((prev) => ({
                ...prev,
                lessons: lessons
                  .map((lesson) => ({
                    ...lesson,
                    isLocked: lesson.isLocked,
                    porcentajecompletado: lesson.userProgress,
                    isNew: lesson.isNew,
                  }))
                  .sort((a, b) => a.title.localeCompare(b.title)),
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
      } finally {
        setIsCheckingEnrollment(false);
        setIsLoading(false);
      }
    };

    void checkEnrollmentAndProgress();
  }, [userId, user, initialCourse.id, initialCourse.enrollments]);

  if (isLoading) {
    return <CourseDetailsSkeleton />;
  }

  const handleEnroll = async () => {
    if (!isSignedIn) {
      toast.error('Debes iniciar sesión');
      void router.push(`/sign-in?redirect_url=${pathname}`);
      return;
    }

    if (isEnrolling) return;

    setIsEnrolling(true);

    try {
      console.log('Enrolling user in course', { courseId: course.id });

      // Call the server action directly
      const result = await enrollInCourse(course.id);

      if (result.success) {
        setTotalStudents((prev) => prev + 1);
        setIsEnrolled(true);
        toast.success('¡Te has inscrito exitosamente!');

        // Actualizar curso y progreso desde la BD
        const updatedCourse = await getCourseById(course.id, userId);
        const lessons = updatedCourse
          ? await getLessonsByCourseId(course.id, userId)
          : [];
        if (updatedCourse) {
          setCourse({
            ...updatedCourse,
            lessons:
              lessons?.map((lesson) => ({
                ...lesson,
                isLocked: lesson.isLocked,
                porcentajecompletado: lesson.userProgress,
                isNew: lesson.isNew,
              })) ?? [],
          });
        }
      } else {
        // Handle specific enrollment errors
        if (result.message === 'Ya estás inscrito en este curso') {
          setIsEnrolled(true);
          toast.info('Ya estás inscrito en este curso');

          // Update course data to reflect enrollment
          const updatedCourse = await getCourseById(course.id, userId);
          const lessons = updatedCourse
            ? await getLessonsByCourseId(course.id, userId)
            : [];
          if (updatedCourse) {
            setCourse({
              ...updatedCourse,
              lessons:
                lessons?.map((lesson) => ({
                  ...lesson,
                  isLocked: lesson.isLocked,
                  porcentajecompletado: lesson.userProgress,
                  isNew: lesson.isNew,
                })) ?? [],
            });
          }
        } else if (result.requiresSubscription) {
          toast.error('Suscripción requerida', {
            description: 'Necesitas una suscripción activa para inscribirte.',
          });
          window.open('/planes', '_blank');
        } else {
          toast.error('Error en la inscripción', {
            description: result.message,
          });
        }
      }
    } catch (error) {
      console.error('Error en la inscripción:', error);
      toast.error('Error al inscribirse al curso');
    } finally {
      setIsEnrolling(false);
    }
  };

  const onEnrollAction = async () => {
    try {
      console.log('onEnrollAction called');
      // IMPORTANT: This function is called by CourseHeader for ALL course types
      // Directly call handleEnroll to ensure the user gets enrolled
      await handleEnroll();
    } catch (error) {
      console.error('Error en onEnrollAction:', error);
      toast.error('Error al procesar la inscripción');
    }
  };

  const handleUnenroll = async () => {
    if (!isSignedIn || isUnenrolling) return;
    setIsUnenrolling(true);

    try {
      const result = await unenrollFromCourse(course.id);
      if (result.success) {
        setIsEnrolled(false);
        setTotalStudents((prev) => prev - 1);
        // Recargar lecciones desde la BD para reflejar el estado actualizado
        const lessons = await getLessonsByCourseId(course.id, userId);
        setCourse((prev) => ({
          ...prev,
          enrollments: Array.isArray(prev.enrollments)
            ? prev.enrollments.filter(
                (enrollment: Enrollment) => enrollment.userId !== userId
              )
            : [],
          lessons:
            lessons?.map((lesson) => ({
              ...lesson,
              isLocked: lesson.isLocked,
              porcentajecompletado: lesson.userProgress,
              isNew: lesson.isNew,
            })) ?? [],
        }));
        toast.success('Has cancelado tu inscripción al curso correctamente');
      }
    } catch (error) {
      console.error('Error al cancelar la inscripción:', error);
    } finally {
      setIsUnenrolling(false);
    }
  };

  const handleEnrollmentChange = (enrolled: boolean) => {
    setIsEnrolled(enrolled);
  };

  // Modificar cómo obtenemos la información del programa
  const programInfo =
    course.materias?.find((m) => m.programa)?.programa ?? null;

  return (
    <div className="bg-background min-h-screen">
      <main className="mx-auto max-w-7xl pt-0 pb-4 md:pb-6 lg:pb-8">
        <CourseBreadcrumb
          title={course.title}
          programInfo={
            programInfo
              ? {
                  id: programInfo.id.toString(),
                  title: programInfo.title,
                }
              : null
          }
        />
        <CourseHeader
          course={course}
          totalStudents={totalStudents}
          isEnrolled={isEnrolled}
          isEnrolling={isEnrolling}
          isUnenrolling={isUnenrolling}
          isSubscriptionActive={isSubscriptionActive}
          subscriptionEndDate={
            user?.publicMetadata?.subscriptionEndDate as string | null
          }
          onEnrollAction={onEnrollAction}
          onUnenrollAction={handleUnenroll}
          isCheckingEnrollment={isCheckingEnrollment}
        />

        <div className="mt-8 space-y-8">
          <CourseComments
            courseId={course.id}
            isEnrolled={isEnrolled}
            onEnrollmentChange={handleEnrollmentChange}
          />
          <StudentChatbot isAlwaysVisible={true} />
        </div>
      </main>
    </div>
  );
}
