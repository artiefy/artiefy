'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useProgress } from '@bprogress/next';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import LessonActivities from '~/components/estudiantes/layout/lessondetail/LessonActivities';
import LessonBreadcrumbs from '~/components/estudiantes/layout/lessondetail/LessonBreadcrumbs';
import LessonCards from '~/components/estudiantes/layout/lessondetail/LessonCards';
import LessonComments from '~/components/estudiantes/layout/lessondetail/LessonComments';
import LessonNavigation from '~/components/estudiantes/layout/lessondetail/LessonNavigation';
import LessonPlayer from '~/components/estudiantes/layout/lessondetail/LessonPlayer';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';
import { completeActivity } from '~/server/actions/estudiantes/progress/completeActivity';
import { updateLessonProgress } from '~/server/actions/estudiantes/progress/updateLessonProgress';
import {
  type Activity,
  type Course,
  type Lesson,
  type LessonWithProgress,
  type UserActivitiesProgress,
  type UserLessonsProgress,
} from '~/types';
import { sortLessons } from '~/utils/lessonSorting';
import {
  restoreScrollPosition,
  saveScrollPosition,
} from '~/utils/scrollPosition';
import { useMediaQuery } from '~/utils/useMediaQuery';

interface LessonDetailsProps {
  lesson: LessonWithProgress;
  activities: Activity[]; // Change from activity to activities
  lessons: Lesson[];
  userLessonsProgress: UserLessonsProgress[];
  userActivitiesProgress: UserActivitiesProgress[];
  userId: string;
  course: Course;
}

// Move these hooks to the top level
const isLastLesson = (lessons: LessonWithProgress[], currentId: number) => {
  const sortedLessons = sortLessons(lessons);
  const currentIndex = sortedLessons.findIndex((l) => l.id === currentId);
  return currentIndex === sortedLessons.length - 1;
};

const isLastActivity = (
  lessons: LessonWithProgress[],
  activities: Activity[],
  currentLesson: LessonWithProgress
) => {
  if (!lessons.length || !activities.length) return false;
  const sortedLessons = sortLessons(lessons);
  const lastLesson = sortedLessons[sortedLessons.length - 1];
  const isCurrentLessonLast = currentLesson?.id === lastLesson?.id;
  if (!isCurrentLessonLast) return false;
  const lastActivity = activities[activities.length - 1];
  return activities[0]?.id === lastActivity?.id;
};

export default function LessonDetails({
  lesson,
  activities = [],
  lessons = [],
  userLessonsProgress = [],
  userActivitiesProgress = [],
  userId,
  course,
}: LessonDetailsProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  // Add selectedLessonId state
  const [selectedLessonId, setSelectedLessonId] = useState<number>(lesson?.id);
  const [progress, setProgress] = useState(lesson?.porcentajecompletado ?? 0);
  const [isVideoCompleted, setIsVideoCompleted] = useState(
    lesson?.porcentajecompletado === 100
  );
  // Update to use first activity's completion status
  const [isActivityCompleted, setIsActivityCompleted] = useState(
    activities[0]?.isCompleted ?? false
  );
  // Inicializar lessonsState con un valor predeterminado
  const [lessonsState, setLessonsState] = useState<LessonWithProgress[]>(() =>
    sortLessons(lessons).map((lessonItem) => ({
      ...lessonItem,
      isLocked: true,
      porcentajecompletado: 0,
      isCompleted: false,
      isNew: true,
      courseTitle: lesson.courseTitle,
    }))
  );

  // Mover la inicialización de estados al useEffect con una bandera
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const searchParams = useSearchParams();
  const { start, stop } = useProgress();

  // Add isInitialized ref to prevent infinite loop
  const isInitialized = useRef(false);

  // Move course active check to the top
  useEffect(() => {
    if (!course.isActive) {
      toast.error('Curso no disponible', {
        description: 'Este curso no está disponible actualmente.',
      });
      router.push('/estudiantes');
    }
  }, [course.isActive, router]);

  useEffect(() => {
    if (!isInitialized.current) {
      setProgress(lesson?.porcentajecompletado ?? 0);
      setIsVideoCompleted(lesson?.porcentajecompletado === 100);
      setIsActivityCompleted(activities[0]?.isCompleted ?? false);
      isInitialized.current = true;
    }
  }, [lesson?.porcentajecompletado, activities]);

  // Show loading progress on initial render
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // Mover la inicialización de lecciones a un useEffect
  useEffect(() => {
    if (isInitialLoad && lessons.length > 0) {
      const initializeLessonsState = () => {
        const sortedLessons = sortLessons(lessons);

        const lessonsWithProgress = sortedLessons.map((lessonItem, index) => {
          const progress = userLessonsProgress.find(
            (p) => p.lessonId === lessonItem.id
          );

          const isFirst =
            index === 0 ||
            lessonItem.title.toLowerCase().includes('bienvenida');

          return {
            ...lessonItem,
            isLocked: isFirst ? false : (progress?.isLocked ?? true),
            porcentajecompletado: progress?.progress ?? 0,
            isCompleted: progress?.isCompleted ?? false,
            isNew: progress?.isNew ?? true,
            courseTitle: lesson.courseTitle,
          };
        });

        setLessonsState(lessonsWithProgress);
        setIsInitialLoad(false);
      };

      initializeLessonsState();
    }
  }, [
    isInitialLoad,
    lessons,
    userLessonsProgress,
    lesson.courseTitle,
    setLessonsState,
  ]);

  // Usar userActivitiesProgress para algo útil, por ejemplo, mostrar el progreso de las actividades
  useEffect(() => {
    console.log(userActivitiesProgress);
    // Aquí puedes agregar lógica para usar userActivitiesProgress en la interfaz de usuario
  }, [userActivitiesProgress]);

  // Handle lesson navigation
  useEffect(() => {
    if (selectedLessonId !== null && selectedLessonId !== lesson?.id) {
      saveScrollPosition();
      setProgress(0);
      setIsVideoCompleted(false);
      setIsActivityCompleted(false);
      void router.push(`/estudiantes/clases/${selectedLessonId}`);
    }
  }, [selectedLessonId, lesson?.id, router]);

  // Restore scroll position on route change
  useEffect(() => {
    restoreScrollPosition();
  }, [lesson?.id]);

  // Redirect if the lesson is locked
  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;

    if (lesson?.isLocked) {
      // Usar una única función para manejar el toast y la redirección
      const handleLockedLesson = () => {
        // Limpiar cualquier timeout existente
        if (redirectTimeout) clearTimeout(redirectTimeout);

        // Mostrar un único toast
        toast.error('Lección bloqueada', {
          description:
            'Completa las lecciones anteriores para desbloquear esta clase.',
          // Evitar que el toast se muestre múltiples veces
          id: 'lesson-locked',
        });

        // Configurar la redirección con un nuevo timeout
        redirectTimeout = setTimeout(() => {
          void router.replace(`/estudiantes/cursos/${lesson.courseId}`);
        }, 2000);
      };

      handleLockedLesson();

      // Limpiar el timeout si el componente se desmonta
      return () => {
        if (redirectTimeout) clearTimeout(redirectTimeout);
      };
    }
  }, [lesson?.isLocked, lesson.courseId, router]);

  // Verificar si el usuario está inscrito en el curso
  useEffect(() => {
    const checkEnrollment = async () => {
      const isEnrolled = await isUserEnrolled(lesson.courseId, userId);
      if (!isEnrolled) {
        toast.error('Debes estar inscrito en el curso para ver esta lección.');
        void router.replace(`/estudiantes/cursos/${lesson.courseId}`);
      }
    };

    void checkEnrollment();
  }, [lesson.courseId, userId, router]);

  // Update this function to properly handle async/await
  const handleProgressUpdate = useCallback(
    async (videoProgress: number) => {
      const roundedProgress = Math.round(videoProgress);

      // Only update if progress is different from current
      if (roundedProgress !== progress) {
        try {
          // Update local state immediately
          setProgress(roundedProgress);

          // Update lessons state
          setLessonsState((prevLessons) =>
            prevLessons.map((l) =>
              l.id === lesson.id
                ? {
                    ...l,
                    porcentajecompletado: roundedProgress,
                    isCompleted: roundedProgress === 100,
                    isNew: roundedProgress > 1 ? false : l.isNew,
                  }
                : l
            )
          );

          // Use Promise.resolve for state updates
          await Promise.resolve();

          // Update database
          return updateLessonProgress(lesson.id, roundedProgress);
        } catch (error) {
          console.error('Error al actualizar el progreso:', error);
          toast.error('Error al sincronizar el progreso');
        }
      }
    },
    [progress, lesson.id, setLessonsState]
  );

  // Update video end handler
  const handleVideoEnd = async () => {
    try {
      await handleProgressUpdate(100);
      setIsVideoCompleted(true);

      toast.success('Clase completada', {
        description: activities.length
          ? 'Ahora completa la actividad para continuar'
          : 'Video completado exitosamente',
      });
    } catch (error) {
      console.error('Error al completar la lección:', error);
      toast.error('Error al marcar la lección como completada');
    }
  };

  // Handle activity completion event
  const handleActivityCompletion = async () => {
    if (!activities.length || !isVideoCompleted) return;

    try {
      await completeActivity(activities[0].id, userId); // Add userId parameter
      setIsActivityCompleted(true);

      // Remove automatic unlocking - let modal handle it
      toast.success('¡Actividad completada!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al completar la actividad');
    }
  };

  // Add new effect to handle URL-based lesson unlocking
  useEffect(() => {
    if (!lesson?.isLocked && !isVideoCompleted) {
      setProgress(lesson?.porcentajecompletado ?? 0);
      setIsVideoCompleted(lesson?.porcentajecompletado === 100);
    }
  }, [lesson, isVideoCompleted]);

  // Update handleNavigationClick to use await
  const handleNavigationClick = async (direction: 'prev' | 'next') => {
    if (isNavigating) return;
    const sortedLessons = sortLessons(lessonsState);
    const currentIndex = sortedLessons.findIndex(
      (l) => l.id === selectedLessonId
    );

    const targetLesson =
      direction === 'prev'
        ? sortedLessons
            .slice(0, currentIndex)
            .reverse()
            .find((l) => !l.isLocked)
        : sortedLessons.slice(currentIndex + 1).find((l) => !l.isLocked);

    if (targetLesson) {
      await navigateWithProgress(targetLesson.id);
    }
  };

  // Update handleCardClick to use await
  const handleCardClick = async (targetId: number) => {
    if (!isNavigating && targetId !== selectedLessonId) {
      // Convert to Promise
      await Promise.resolve(navigateWithProgress(targetId));
    }
  };

  // Handle progress bar on route changes
  useEffect(() => {
    stop();
  }, [searchParams, stop]);

  // Helper function for navigation with progress
  const navigateWithProgress = async (targetId: number) => {
    if (isNavigating) return;

    setIsNavigating(true);
    start();

    try {
      saveScrollPosition();
      const navigationPromise = router.push(`/estudiantes/clases/${targetId}`);
      setSelectedLessonId(targetId);

      // Create and resolve a Promise for state updates
      await Promise.all([
        navigationPromise,
        new Promise<void>((resolve) => {
          setProgress(0);
          setIsVideoCompleted(false);
          setIsActivityCompleted(false);
          resolve();
        }),
      ]);
    } finally {
      stop();
      setIsNavigating(false);
    }
  };

  // Keep subscription check but remove the loading UI
  useEffect(() => {
    if (!user || course.courseType?.requiredSubscriptionLevel === 'none') {
      return;
    }

    const metadata = user.publicMetadata as {
      planType?: string;
      subscriptionStatus?: string;
      subscriptionEndDate?: string;
    };

    if (!metadata.subscriptionStatus || !metadata.subscriptionEndDate) {
      toast.error('Se requiere una suscripción activa para ver las clases');
      void router.push('/planes');
      return;
    }

    const isActive = metadata.subscriptionStatus === 'active';
    const endDate = new Date(metadata.subscriptionEndDate);
    const isValid = endDate > new Date();

    if (!isActive || !isValid) {
      toast.error('Se requiere una suscripción activa para ver las clases');
      void router.push('/planes');
    }
  }, [user, course.courseType?.requiredSubscriptionLevel, router]);

  // Add safety check for lesson
  // (Mover el return al final para no romper el orden de hooks)

  // Helper para parsear fechas en formato yyyy/MM/dd y yyyy-MM-dd
  const parseSubscriptionDate = (dateString: string | null): Date | null => {
    if (!dateString) return null;
    // Try ISO first
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) return isoDate;
    // yyyy/MM/dd
    const matchSlash = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(dateString);
    if (matchSlash) {
      const [, year, month, day] = matchSlash;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    // yyyy-MM-dd
    const matchDash = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
    if (matchDash) {
      const [, year, month, day] = matchDash;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    return null;
  };

  // Verificar acceso a la lección según el tipo de curso
  useEffect(() => {
    if (!user || !course.courseType) return;

    const metadata = user.publicMetadata as {
      planType?: string;
      subscriptionStatus?: string;
      subscriptionEndDate?: string;
    };

    const courseTypeName = course.courseType.name;
    const requiredLevel = course.courseType.requiredSubscriptionLevel;
    const isIndividual = courseTypeName === 'Individual';
    const isFree = courseTypeName === 'Free';
    const isSubscription =
      requiredLevel === 'pro' || requiredLevel === 'premium';

    // Si es Free, dejar pasar
    if (isFree) return;

    // Si es Individual, verificar inscripción individual
    if (isIndividual) {
      // Tipar enrollments correctamente
      const enrollmentsArr = Array.isArray(course.enrollments)
        ? (course.enrollments as { userId: string; isPermanent: boolean }[])
        : [];
      const hasIndividualEnrollment = enrollmentsArr.some(
        (e) => e.userId === user.id && e.isPermanent
      );
      if (!hasIndividualEnrollment) {
        toast.error('Debes comprar este curso para acceder a las clases.');
        void router.push(`/estudiantes/cursos/${course.id}`);
      }
      return;
    }

    // Si es de suscripción (pro/premium), verificar suscripción activa y fecha
    if (isSubscription) {
      if (!metadata.subscriptionStatus || !metadata.subscriptionEndDate) {
        toast.error('Se requiere una suscripción activa para ver las clases');
        void router.push('/planes');
        return;
      }
      const isActive = metadata.subscriptionStatus === 'active';
      const endDate = parseSubscriptionDate(metadata.subscriptionEndDate);
      const isValid = endDate ? endDate > new Date() : false;
      if (!isActive || !isValid) {
        toast.error('Se requiere una suscripción activa para ver las clases');
        void router.push('/planes');
      }
    }
  }, [user, course, router]);

  // Detectar si es móvil (pantalla <= 768px) - MOVER ARRIBA
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!lesson) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Lección no encontrada</p>
      </div>
    );
  }

  // Function to handle lesson unlock
  const handleLessonUnlocked = (lessonId: number) => {
    setLessonsState((prevLessons) =>
      prevLessons.map((lesson) =>
        lesson.id === lessonId
          ? { ...lesson, isLocked: false, isNew: true }
          : lesson
      )
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <LessonBreadcrumbs
        courseTitle={lesson.courseTitle}
        courseId={lesson.courseId}
        lessonTitle={lesson.title}
      />
      <div className="bg-background flex flex-1 flex-col gap-4 px-2 py-2 md:flex-row md:px-4 md:py-6">
        {/* Left Sidebar */}
        {!isMobile && (
          <div className="bg-background mb-2 w-full flex-shrink-0 overflow-x-auto rounded-lg p-2 shadow-none md:mb-0 md:w-80 md:overflow-visible md:p-4 md:shadow-sm lg:w-80">
            <h2 className="text-primary mb-4 text-xl font-bold md:text-2xl">
              Clases
            </h2>
            <LessonCards
              lessonsState={lessonsState}
              selectedLessonId={selectedLessonId}
              onLessonClick={handleCardClick}
              progress={progress}
              isNavigating={isNavigating}
              setLessonsState={setLessonsState}
              courseId={lesson.courseId}
              userId={userId}
              isMobile={false}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex w-full max-w-full min-w-0 flex-1 flex-col p-0 md:p-6">
          <div className="navigation-buttons">
            <div className="mb-2 md:mb-4">
              <LessonNavigation
                onNavigate={handleNavigationClick}
                lessonsState={lessonsState}
                lessonOrder={new Date(lesson.createdAt).getTime()}
                isNavigating={isNavigating}
                isMobile={isMobile}
              />
            </div>
            {/* Mostrar el select de clases debajo de los botones de navegación en móvil */}
            {isMobile && (
              <div className="mb-4">
                <LessonCards
                  lessonsState={lessonsState}
                  selectedLessonId={selectedLessonId}
                  onLessonClick={handleCardClick}
                  progress={progress}
                  isNavigating={isNavigating}
                  setLessonsState={setLessonsState}
                  courseId={lesson.courseId}
                  userId={userId}
                  isMobile={true}
                />
              </div>
            )}
          </div>
          <LessonPlayer
            lesson={lesson}
            progress={progress}
            handleVideoEnd={handleVideoEnd}
            handleProgressUpdate={handleProgressUpdate}
          />
          <LessonComments lessonId={lesson.id} />
        </div>

        {/* Right Sidebar */}
        <div className="mt-2 flex w-full flex-shrink-0 flex-col overflow-x-auto rounded-lg p-0 shadow-none md:mt-0 md:w-80 md:overflow-visible md:p-4 md:shadow-sm lg:w-72">
          <LessonActivities
            activities={activities}
            isVideoCompleted={isVideoCompleted}
            isActivityCompleted={isActivityCompleted}
            handleActivityCompletion={handleActivityCompletion}
            userId={userId}
            onLessonUnlocked={handleLessonUnlocked}
            courseId={lesson.courseId}
            lessonId={lesson.id}
            isLastLesson={isLastLesson(lessonsState, lesson.id)}
            isLastActivity={isLastActivity(lessonsState, activities, lesson)}
            lessons={lessonsState}
          />
        </div>

        {/* Chatbot Button and Modal */}
        <StudentChatbot isAlwaysVisible={true} />
      </div>
    </div>
  );
}
