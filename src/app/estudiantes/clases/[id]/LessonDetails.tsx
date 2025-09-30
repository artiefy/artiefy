'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useProgress } from '@bprogress/next';
import { useUser } from '@clerk/nextjs';
import { FaCheckCircle, FaLock } from 'react-icons/fa';
import { toast } from 'sonner';

import LessonActivities from '~/components/estudiantes/layout/lessondetail/LessonActivities';
import { LessonActivityModal } from '~/components/estudiantes/layout/lessondetail/LessonActivityModal';
import LessonBreadcrumbs from '~/components/estudiantes/layout/lessondetail/LessonBreadcrumbs';
import LessonCards from '~/components/estudiantes/layout/lessondetail/LessonCards';
import LessonComments from '~/components/estudiantes/layout/lessondetail/LessonComments';
// Import the missing components
import { GradeHistory } from '~/components/estudiantes/layout/lessondetail/LessonGradeHistory';
import { LessonGrades } from '~/components/estudiantes/layout/lessondetail/LessonGrades';
import LessonNavigation from '~/components/estudiantes/layout/lessondetail/LessonNavigation';
import LessonPlayer from '~/components/estudiantes/layout/lessondetail/LessonPlayer';
import LessonResource from '~/components/estudiantes/layout/lessondetail/LessonResource';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { Progress } from '~/components/estudiantes/ui/progress';
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

import '~/styles/arrowactivity.css';

// Add interface for API response
interface GradeSummaryResponse {
  finalGrade: number;
  isCompleted: boolean;
  parameters: {
    name: string;
    grade: number;
    weight: number;
    activities: {
      id: number;
      name: string;
      grade: number;
    }[];
  }[];
}

// Update CourseGradeSummary interface to match GradeHistory requirements
interface CourseGradeSummary {
  finalGrade: number;
  courseCompleted?: boolean;
  parameters: {
    name: string;
    grade: number;
    weight: number;
    activities: {
      id: number;
      name: string;
      grade: number;
    }[];
  }[];
}

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
  const [selectedLessonId, setSelectedLessonId] = useState<number>(lesson?.id);
  const [progress, setProgress] = useState(lesson?.porcentajecompletado ?? 0);
  const [isVideoCompleted, setIsVideoCompleted] = useState(
    lesson?.porcentajecompletado === 100
  );
  const [isActivityCompleted, setIsActivityCompleted] = useState(
    activities[0]?.isCompleted ?? false
  );
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

  // Add the missing state variables
  const [isGradeHistoryOpen, setIsGradeHistoryOpen] = useState(false);
  const [isGradesLoading, setIsGradesLoading] = useState(true);
  const [gradeSummary, setGradeSummary] = useState<CourseGradeSummary | null>(
    null
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const searchParams = useSearchParams();
  const { start, stop } = useProgress();
  const isInitialized = useRef(false);

  // Add the activity modal state variables at the top level
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedActivityForModal, setSelectedActivityForModal] =
    useState<Activity | null>(null);

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

  // Update the useEffect that loads grades with proper typing
  useEffect(() => {
    const loadGrades = async () => {
      try {
        setIsGradesLoading(true);
        const response = await fetch(
          `/api/grades/summary?courseId=${lesson.courseId}&userId=${userId}`
        );
        if (response.ok) {
          const data = (await response.json()) as GradeSummaryResponse;
          setGradeSummary({
            finalGrade: data.finalGrade ?? 0,
            courseCompleted: data.isCompleted ?? false,
            parameters: data.parameters ?? [],
          });
        }
      } catch (error) {
        console.error('Error loading grades:', error);
      } finally {
        setIsGradesLoading(false);
      }
    };

    if (lesson.courseId && userId) {
      void loadGrades();
    }
  }, [lesson.courseId, userId]);

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

  // Mueve la lógica de redirección fuera del condicional
  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout | undefined;

    if (lesson?.isLocked) {
      // Mostrar un único toast
      toast.error('Lección bloqueada', {
        description:
          'Completa las lecciones anteriores para desbloquear esta clase.',
        id: 'lesson-locked',
      });

      // Configurar la redirección con un nuevo timeout
      redirectTimeout = setTimeout(() => {
        void router.replace(`/estudiantes/cursos/${lesson.courseId}`);
      }, 2000);
    }

    // Limpiar el timeout si el componente se desmonta
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
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

      const hasActivities = activities.length > 0;
      toast.success('Clase completada', {
        description: hasActivities
          ? 'Ahora completa la actividad para continuar'
          : 'Video completado exitosamente',
      });

      // Si no tiene actividades, actualizar local y pedir desbloqueo siguiente clase
      if (!hasActivities) {
        setProgress(100);
        setLessonsState((prevLessons) =>
          prevLessons.map((l) =>
            l.id === lesson.id
              ? { ...l, porcentajecompletado: 100, isCompleted: true }
              : l
          )
        );

        // Desbloquear siguiente lección estrictamente en orden (el backend valida)
        await fetch('/api/lessons/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentLessonId: lesson.id,
            hasActivities: false,
            allActivitiesCompleted: true,
          }),
        }).catch(() => undefined);
      }
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

  // Update handleNavigationClick to remove async
  const handleNavigationClick = (direction: 'prev' | 'next') => {
    if (isNavigating) return;
    const sortedLessons = sortLessons(lessonsState);
    const currentIndex = sortedLessons.findIndex(
      (l) => l.id === selectedLessonId
    );

    let targetLesson: LessonWithProgress | undefined;
    if (direction === 'prev') {
      targetLesson = sortedLessons
        .slice(0, currentIndex)
        .reverse()
        .find((l) => !l.isLocked);
    } else {
      targetLesson = sortedLessons
        .slice(currentIndex + 1)
        .find((l) => !l.isLocked);
    }

    // Solo navegar si la clase destino está desbloqueada
    if (targetLesson && !targetLesson.isLocked) {
      navigateWithProgress(targetLesson.id);
    }
  };

  // Update handleCardClick to remove await and Promise.resolve
  const handleCardClick = (targetId: number) => {
    if (!isNavigating && targetId !== selectedLessonId) {
      navigateWithProgress(targetId);
    }
  };

  // Handle progress bar on route changes
  useEffect(() => {
    stop();
  }, [searchParams, stop]);

  // Helper function for navigation with progress
  const navigateWithProgress = (targetId: number) => {
    if (isNavigating) return;

    setIsNavigating(true);
    start();

    try {
      saveScrollPosition();
      setSelectedLessonId(targetId);
      setProgress(0);
      setIsVideoCompleted(false);
      setIsActivityCompleted(false);
      router.push(`/estudiantes/clases/${targetId}`);
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

  // Estado para la transcripción (hook debe ir arriba, nunca en condicional)
  const [transcription, setTranscription] = useState<
    { start: number; end: number; text: string }[]
  >([]);
  const [isLoadingTranscription, setIsLoadingTranscription] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  // Solo declara activityModalId/setActivityModalId una vez aquí
  const [activityModalId, setActivityModalId] = useState<number | undefined>(
    undefined
  );

  // Obtener la transcripción al montar el componente
  useEffect(() => {
    const fetchTranscription = async () => {
      setIsLoadingTranscription(true);
      try {
        const res = await fetch(
          `/api/lessons/getTranscription?lessonId=${lesson.id}`
        );
        if (!res.ok) {
          setTranscription([]);
          setIsLoadingTranscription(false);
          return;
        }
        // Tipar la respuesta
        interface TranscriptionResponse {
          transcription?:
            | string
            | { start: number; end: number; text: string }[];
        }
        const data: TranscriptionResponse = await res.json();
        let parsed: { start: number; end: number; text: string }[] = [];
        if (typeof data.transcription === 'string') {
          try {
            parsed = JSON.parse(data.transcription) as {
              start: number;
              end: number;
              text: string;
            }[];
          } catch {
            parsed = [];
          }
        } else if (Array.isArray(data.transcription)) {
          parsed = data.transcription;
        }
        setTranscription(parsed);
      } catch {
        setTranscription([]);
      } finally {
        setIsLoadingTranscription(false);
      }
    };
    fetchTranscription();
  }, [lesson.id]);

  // En el efecto que lee el query param, asigna undefined si no existe
  useEffect(() => {
    const activityIdParam = searchParams
      ? searchParams.get('activityId')
      : null;
    setActivityModalId(activityIdParam ? Number(activityIdParam) : undefined);
  }, [searchParams, setActivityModalId]);

  // En el evento global, asigna undefined si no existe activityId
  useEffect(() => {
    const handler = (event: CustomEvent<{ activityId: number }>) => {
      setActivityModalId(event.detail?.activityId ?? undefined);
    };
    window.addEventListener('open-activity-modal', handler as EventListener);
    return () => {
      window.removeEventListener(
        'open-activity-modal',
        handler as EventListener
      );
    };
  }, [setActivityModalId]);

  if (!lesson) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Lección no encontrada</p>
      </div>
    );
  }

  // Add safety check for lesson
  if (lesson.isLocked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>
          Lección bloqueada. Completa las lecciones anteriores para desbloquear
          esta clase.
        </p>
      </div>
    );
  }

  // Si aquí se mapean varias lecciones, ordena así:
  // const orderedLessons = lessons?.slice().sort(
  //   (a, b) =>
  //     (a.orderIndex ?? 1e9) - (b.orderIndex ?? 1e9) || (a.id ?? 0) - (b.id ?? 0)
  // );

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

  // Add these functions inside your component before the return statement
  const handleCompletedActivityClick = (activity: Activity) => {
    // If activityModalId is defined, open the modal
    setActivityModalId(activity.id);
  };

  // Añade esta función para manejar el cierre del modal
  const handleActivityModalClose = () => {
    setIsActivityModalOpen(false);
    setSelectedActivityForModal(null);
    setActivityModalId(undefined);
  };

  // Añade esta función para manejar la compleción de la actividad modal
  const markActivityAsCompletedAction = async (): Promise<void> => {
    if (selectedActivityForModal) {
      // Aquí puedes añadir lógica adicional si es necesario
    }
    return Promise.resolve();
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
              lessons={lessonsState}
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
                  lessons={lessonsState}
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

          {/* ACTIVIDADES EN EL CENTRO CUANDO NO HAY VIDEO */}
          {!isMobile && lesson.coverVideoKey === 'none' ? (
            <div className="mx-auto w-full max-w-4xl rounded-lg bg-white shadow">
              <div className="rounded-lg bg-white p-4 shadow-xs md:p-6">
                <h1 className="mb-2 text-xl font-bold text-gray-900 md:mb-4 md:text-2xl">
                  {lesson.title}
                </h1>
                <p className="mb-6 font-semibold text-gray-600">
                  {lesson.description}
                </p>

                {/* Contenedor destacado para la actividad principal cuando no hay video */}
                {activities.length > 0 ? (
                  <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-4 flex flex-col items-center justify-center text-center">
                      <h2 className="mb-2 text-2xl font-bold text-gray-800">
                        {activities[0].name}
                      </h2>
                      <p className="mb-6 max-w-3xl text-gray-600">
                        {activities[0].description}
                      </p>

                      <div className="flex w-full max-w-md flex-col items-center space-y-2">
                        {/* Botón que imita exactamente el del sidebar, incluyendo estados de carga */}
                        {(() => {
                          // Use underscore prefix for unused variables
                          const _activityState = activities[0]
                            ? {
                                isCompleted: activities[0].isCompleted || false,
                                isLoading: false,
                                typeid: activities[0].typeid,
                              }
                            : null;

                          return (
                            <button
                              onClick={() => {
                                if (activities[0]) {
                                  // Establece directamente los estados para el modal
                                  setSelectedActivityForModal(activities[0]);
                                  setIsActivityModalOpen(true);

                                  // También actualiza el activityModalId para mantener la consistencia
                                  setActivityModalId(activities[0].id);
                                }
                              }}
                              className="group relative z-10 w-full overflow-hidden rounded-md px-6 py-4 text-lg font-semibold text-black transition-all duration-300"
                            >
                              {/* Animated gradient background */}
                              <div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-r from-[#3AF4EF] to-[#2ecc71] opacity-80 group-hover:from-green-700 group-hover:to-green-700" />

                              <span className="relative z-10 flex items-center justify-center">
                                {(() => {
                                  // Use the activity state directly here
                                  const activityState = activities[0]
                                    ? {
                                        isCompleted:
                                          activities[0].isCompleted || false,
                                        isLoading: false,
                                        typeid: activities[0].typeid,
                                      }
                                    : null;

                                  return (
                                    <>
                                      {activityState?.isLoading && (
                                        <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                                      )}
                                      {activityState?.isCompleted ? (
                                        <>
                                          <span className="font-semibold">
                                            {activityState.typeid === 1
                                              ? 'Ver Documento'
                                              : 'Ver Resultados'}
                                          </span>
                                          <FaCheckCircle className="ml-2 inline text-white" />
                                        </>
                                      ) : (
                                        <span className="font-semibold">
                                          Ver Actividad
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </span>
                            </button>
                          );
                        })()}

                        <div className="mt-4 w-full">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-bold text-gray-700">
                              Progreso de la clase
                            </span>
                            <span className="text-gray-600">{progress}%</span>
                          </div>
                          <Progress value={progress} showPercentage={true} />
                        </div>
                      </div>
                    </div>

                    {/* Lista de actividades adicionales si hay más de una */}
                    {activities.length > 1 && (
                      <div className="mt-8 border-t border-blue-200 pt-6">
                        <h3 className="mb-4 text-lg font-semibold text-blue-800">
                          Actividades adicionales
                        </h3>
                        <div className="space-y-4">
                          {activities.slice(1).map((activity, index) => {
                            const isLocked = !isVideoCompleted && index > 0;
                            return (
                              <div
                                key={activity.id}
                                className={`rounded-lg border bg-white p-4 shadow-sm ${
                                  isLocked
                                    ? 'bg-gray-100 opacity-60'
                                    : 'bg-white'
                                }`}
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <h3 className="font-semibold text-gray-900">
                                    {activity.name}
                                  </h3>
                                  <div className="ml-2 rounded-full bg-blue-100 p-1">
                                    {activity.isCompleted ? (
                                      <FaCheckCircle className="text-green-500" />
                                    ) : isLocked ? (
                                      <FaLock className="text-gray-400" />
                                    ) : (
                                      <div className="text-blue-500">
                                        {index === 0
                                          ? 'Disponible'
                                          : 'Pendiente'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className="mb-4 text-sm text-gray-600">
                                  {activity.description}
                                </p>
                                <div className="flex justify-center">
                                  <Button
                                    onClick={() => {
                                      if (activity.isCompleted) {
                                        handleCompletedActivityClick(activity);
                                      } else if (!isLocked) {
                                        // Abrir el modal correctamente al iniciar actividad
                                        setActivityModalId(activity.id);
                                      }
                                    }}
                                    disabled={isLocked}
                                    className={`rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 font-medium text-white hover:from-blue-600 hover:to-indigo-700 ${
                                      isLocked
                                        ? 'cursor-not-allowed opacity-60'
                                        : ''
                                    }`}
                                  >
                                    {activity.isCompleted
                                      ? 'Ver Resultados'
                                      : isLocked
                                        ? 'Bloqueada'
                                        : 'Iniciar Actividad'}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                    <p className="text-gray-600">
                      No hay actividades disponibles para esta clase.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Solo mostrar LessonPlayer si hay video o si NO es móvil
            (lesson.coverVideoKey !== 'none' || !isMobile) && (
              <LessonPlayer
                lesson={lesson}
                progress={progress}
                handleVideoEnd={handleVideoEnd}
                handleProgressUpdate={handleProgressUpdate}
                transcription={transcription}
                isLoadingTranscription={isLoadingTranscription}
              />
            )
          )}

          {/* ACTIVIDADES ARRIBA DE COMENTARIOS EN MOBILE */}
          {isMobile && (
            <div className="mt-4">
              <LessonActivities
                activities={activities}
                isVideoCompleted={
                  lesson.coverVideoKey === 'none' ? true : isVideoCompleted
                }
                isActivityCompleted={isActivityCompleted}
                handleActivityCompletion={handleActivityCompletion}
                userId={userId}
                onLessonUnlocked={handleLessonUnlocked}
                courseId={lesson.courseId}
                lessonId={lesson.id}
                isLastLesson={isLastLesson(lessonsState, lesson.id)}
                isLastActivity={isLastActivity(
                  lessonsState,
                  activities,
                  lesson
                )}
                lessons={lessonsState}
                activityModalId={activityModalId}
                lessonCoverVideoKey={lesson.coverVideoKey} // Pass the coverVideoKey
              />
            </div>
          )}
          <LessonComments lessonId={lesson.id} />
        </div>

        {/* Right Sidebar - SOLO calificaciones y recursos cuando no hay video */}
        {!isMobile && (
          <div className="mt-2 flex w-full flex-shrink-0 flex-col overflow-x-auto rounded-lg p-2 shadow-none md:mt-0 md:w-80 md:overflow-visible md:p-4 md:shadow-sm lg:w-80">
            {lesson.coverVideoKey === 'none' ? (
              <>
                <div className="mt-4">
                  {/* Mostrar mensaje y flecha apuntando hacia la izquierda cuando hay actividades */}
                  <div className="mb-2">
                    <h2 className="text-primary mb-4 text-xl font-bold md:text-2xl">
                      Actividades
                    </h2>
                  </div>
                  {activities.length > 0 && (
                    <div className="mb-6 flex flex-col items-center justify-center rounded-lg bg-gradient-to-r from-cyan-50 to-green-50 p-4 shadow-sm">
                      <p className="mb-2 text-center font-semibold text-emerald-700">
                        Actividad disponible en el centro
                      </p>
                      <div className="arrow-glow-container">
                        {/* Flecha apuntando hacia la izquierda con colores invertidos para mejor visibilidad */}
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="arrow-glow"
                          style={{
                            filter:
                              'drop-shadow(0 0 6px rgba(58, 244, 239, 0.7))',
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="arrowGradient"
                              x1="100%"
                              y1="0%"
                              x2="0%"
                              y2="0%"
                            >
                              <stop offset="0%" stopColor="#3AF4EF" />
                              <stop offset="100%" stopColor="#2ecc71" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M19 12H5M5 12L12 5M5 12L12 19"
                            stroke="url(#arrowGradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <span className="mt-2 text-center text-sm text-gray-600">
                        Haz clic en &quot;Ver Actividad&quot; para completar
                        esta clase
                      </span>
                    </div>
                  )}
                  {/* Grades section */}
                  <div className="mt-4">
                    <h2 className="text-primary mb-4 text-xl font-bold md:text-2xl">
                      Calificaciones
                    </h2>
                    <LessonGrades
                      finalGrade={gradeSummary?.finalGrade ?? null}
                      onViewHistoryAction={() => setIsGradeHistoryOpen(true)}
                      isLoading={isGradesLoading}
                    />
                  </div>

                  {/* Resources section */}
                  <LessonResource lessonId={lesson.id} />
                </div>
              </>
            ) : (
              <LessonActivities
                activities={activities}
                isVideoCompleted={
                  lesson.coverVideoKey === 'none' ? true : isVideoCompleted
                }
                isActivityCompleted={isActivityCompleted}
                handleActivityCompletion={handleActivityCompletion}
                userId={userId}
                onLessonUnlocked={handleLessonUnlocked}
                courseId={lesson.courseId}
                lessonId={lesson.id}
                isLastLesson={isLastLesson(lessonsState, lesson.id)}
                isLastActivity={isLastActivity(
                  lessonsState,
                  activities,
                  lesson
                )}
                lessons={lessonsState}
                activityModalId={activityModalId}
                lessonCoverVideoKey={lesson.coverVideoKey} // Pass the coverVideoKey
              />
            )}
          </div>
        )}

        {/* Modal de actividad montado directamente en LessonDetails */}
        {selectedActivityForModal && (
          <LessonActivityModal
            isOpen={isActivityModalOpen}
            onCloseAction={handleActivityModalClose}
            activity={selectedActivityForModal}
            userId={userId}
            onQuestionsAnsweredAction={(allAnswered) => {
              // Puedes manejar la lógica de respuesta aquí
              if (
                allAnswered &&
                activities[0]?.id === selectedActivityForModal.id
              ) {
                setIsActivityCompleted(true);
              }
            }}
            markActivityAsCompletedAction={markActivityAsCompletedAction}
            onActivityCompletedAction={handleActivityCompletion}
            savedResults={null} // Puedes obtener resultados guardados si es necesario
            onLessonUnlockedAction={handleLessonUnlocked}
            isLastLesson={isLastLesson(lessonsState, lesson.id)}
            courseId={lesson.courseId}
            isLastActivity={isLastActivity(lessonsState, activities, lesson)}
            onViewHistoryAction={() => setIsGradeHistoryOpen(true)}
            onActivityCompleteAction={() => {
              handleActivityCompletion().catch(console.error);
            }}
            isLastActivityInLesson={
              activities[0]?.id === selectedActivityForModal.id
            }
          />
        )}

        {/* GradeHistory modal */}
        <GradeHistory
          isOpen={isGradeHistoryOpen}
          onClose={() => setIsGradeHistoryOpen(false)}
          gradeSummary={
            gradeSummary ?? {
              finalGrade: 0,
              courseCompleted: false,
              parameters: [],
            }
          }
        />

        {/* Chatbot Button and Modal */}
        <StudentChatbot isAlwaysVisible={true} />
      </div>
    </div>
  );
}
