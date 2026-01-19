'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useProgress } from '@bprogress/next';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import LessonActivities from '~/components/estudiantes/layout/lessondetail/LessonActivities';
import { LessonActivityModal } from '~/components/estudiantes/layout/lessondetail/LessonActivityModal';
import LessonCards from '~/components/estudiantes/layout/lessondetail/LessonCards';
import LessonComments from '~/components/estudiantes/layout/lessondetail/LessonComments';
import LessonContentTabs, {
  type TabType,
} from '~/components/estudiantes/layout/lessondetail/LessonContentTabs';
// Import the missing components
import { LessonGradeHistoryInline } from '~/components/estudiantes/layout/lessondetail/LessonGradeHistoryInline';
import { LessonGrades } from '~/components/estudiantes/layout/lessondetail/LessonGrades';
import LessonPlayer from '~/components/estudiantes/layout/lessondetail/LessonPlayer';
import LessonResource from '~/components/estudiantes/layout/lessondetail/LessonResource';
import LessonTopNavBar from '~/components/estudiantes/layout/lessondetail/LessonTopNavBar';
import LessonTranscription from '~/components/estudiantes/layout/lessondetail/LessonTranscription';
import { NextLessonModal } from '~/components/estudiantes/layout/lessondetail/NextLessonModal';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';
import { completeActivity } from '~/server/actions/estudiantes/progress/completeActivity';
import { updateLessonProgress } from '~/server/actions/estudiantes/progress/updateLessonProgress';
import {
  type Activity,
  type Course,
  type CourseType,
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
  const [isGradesLoading, setIsGradesLoading] = useState(true);
  const [gradeSummary, setGradeSummary] = useState<CourseGradeSummary | null>(
    null
  );
  // Tabs state for content navigation
  const [activeTab, setActiveTab] = useState<TabType>('transcription');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
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
    if (!userId || !lesson.courseId) return;

    const checkEnrollment = async () => {
      try {
        const isEnrolled = await isUserEnrolled(lesson.courseId, userId);
        if (!isEnrolled) {
          toast.error(
            'Debes estar inscrito en el curso para ver esta lección.',
            {
              id: 'not-enrolled-lesson',
            }
          );
          void router.replace(`/estudiantes/cursos/${lesson.courseId}`);
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
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

      // Parent state updated; child component (or modal) shows the toast to avoid duplicates
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al completar la actividad');
    }
  };

  // Handle complete button click
  const handleComplete = () => {
    // Mark lesson as completed via API and update local state
    const doComplete = async () => {
      try {
        const res = await fetch('/api/lessons/complete', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: lesson.id }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'Error completing lesson');
        }

        // Update local UI state
        setIsVideoCompleted(true);
        setIsActivityCompleted(true);
        setProgress(100);
        setLessonsState((prev) =>
          prev.map((l) =>
            l.id === lesson.id
              ? { ...l, porcentajecompletado: 100, isCompleted: true }
              : l
          )
        );

        toast.success('Clase marcada como completada');
      } catch (err) {
        console.error('Complete lesson error:', err);
        toast.error('No se pudo marcar la clase como completada');
      }
    };

    void doComplete();
  };

  // Auto-complete when client-side validations detect the lesson is fully completed
  // Determinar si la lección está completamente completada (video + actividades)
  const lessonHasVideo =
    !!lesson.coverVideoKey && lesson.coverVideoKey !== 'none';
  const activitiesCompletedAll = (activities ?? []).length
    ? (activities ?? []).every((a) => a.isCompleted)
    : true;
  const lessonFullyCompleted = lessonHasVideo
    ? isVideoCompleted && activitiesCompletedAll
    : activitiesCompletedAll;

  useEffect(() => {
    if (lessonFullyCompleted) {
      // avoid double calls if already completed in state
      const already = lessonsState.find(
        (l) => l.id === lesson.id && l.isCompleted
      );
      if (!already) {
        void (async () => {
          try {
            const res = await fetch('/api/lessons/complete', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lessonId: lesson.id }),
            });
            const data = await res.json();
            if (res.ok && data?.success) {
              setIsVideoCompleted(true);
              setIsActivityCompleted(true);
              setProgress(100);
              setLessonsState((prev) =>
                prev.map((l) =>
                  l.id === lesson.id
                    ? { ...l, porcentajecompletado: 100, isCompleted: true }
                    : l
                )
              );
            }
          } catch (e) {
            console.error('Auto-complete failed:', e);
          }
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonFullyCompleted, lesson.id]);

  // Handle time update from video player
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

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
    if (!user) return;

    const metadata = user.publicMetadata as {
      planType?: string;
      subscriptionStatus?: string;
      subscriptionEndDate?: string;
    };

    // Combine course.courseType and course.courseTypes (join table) and dedupe
    const combinedTypes: CourseType[] = [];
    if (course.courseType) combinedTypes.push(course.courseType);
    if (Array.isArray(course.courseTypes))
      combinedTypes.push(...course.courseTypes);

    const keySet = new Set<string>();
    const uniqueTypes = combinedTypes.filter((t) => {
      const key = `${t.requiredSubscriptionLevel ?? 'none'}::${t.isPurchasableIndividually ? '1' : '0'}::${t.name ?? ''}`;
      if (keySet.has(key)) return false;
      keySet.add(key);
      return true;
    });

    const hasIndividual = uniqueTypes.some(
      (t) => (t.name ?? '').toLowerCase() === 'individual'
    );
    const hasFree = uniqueTypes.some(
      (t) => (t.requiredSubscriptionLevel ?? 'none') === 'none'
    );
    const hasPro = uniqueTypes.some(
      (t) => (t.requiredSubscriptionLevel ?? '') === 'pro'
    );
    const hasPremium = uniqueTypes.some(
      (t) => (t.requiredSubscriptionLevel ?? '') === 'premium'
    );
    const isSubscription = hasPro || hasPremium;

    // Si es Free, dejar pasar
    if (hasFree) return;

    // Si es Individual, verificar inscripción individual
    if (hasIndividual) {
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
  const [resourcesCount, setResourcesCount] = useState(0);

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

  // Calculate current lesson index for progress bar
  const sortedLessons = sortLessons(lessonsState);
  const currentLessonIndex = sortedLessons.findIndex((l) => l.id === lesson.id);
  const totalLessons = sortedLessons.length;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: '#01152d' }}
    >
      {/* Top Navigation Bar - ahora debajo del header global */}
      <LessonTopNavBar
        courseId={lesson.courseId}
        courseTitle={lesson.courseTitle}
        currentLessonIndex={currentLessonIndex + 1}
        totalLessons={totalLessons}
        progress={progress}
        isCompleted={lessonFullyCompleted}
        onComplete={handleComplete}
        onNavigate={handleNavigationClick}
        lessonsState={lessonsState}
        lessonOrder={new Date(lesson.createdAt).getTime()}
        isNavigating={isNavigating}
        onToggleSidebar={() => {
          if (isMobile) {
            setIsMobileDrawerOpen(!isMobileDrawerOpen);
          } else {
            setIsSidebarOpen(!isSidebarOpen);
          }
        }}
        isSidebarOpen={isMobile ? isMobileDrawerOpen : isSidebarOpen}
        completedCount={
          lessonsState.filter((l) => {
            const hasVideo = !!l.coverVideoKey && l.coverVideoKey !== 'none';
            const hasActivities = (l.activities?.length ?? 0) > 0;
            const activitiesCompleted = hasActivities
              ? (l.activities?.every((a) => a.isCompleted) ?? false)
              : false;
            return hasVideo
              ? l.porcentajecompletado === 100 &&
                  (!hasActivities || activitiesCompleted)
              : hasActivities
                ? activitiesCompleted
                : false;
          }).length
        }
        totalLessonsCount={lessonsState.length}
      />

      {/* Main Layout - sin espacios */}
      <div className="flex flex-1 gap-0">
        {/* Left Sidebar - LessonCards */}
        {!isMobile && isSidebarOpen && (
          <aside
            className="hide-scrollbar sticky top-[calc(4rem+3.5rem)] z-[50] h-[calc(100vh-4rem-3.5rem)] w-80 flex-shrink-0 overflow-y-hidden"
            style={{ backgroundColor: '#061c37cc' }}
          >
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
          </aside>
        )}

        {/* Mobile Drawer Overlay */}
        {isMobile && isMobileDrawerOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            {/* Drawer */}
            <aside
              className="hide-scrollbar fixed top-0 left-0 z-[101] h-full w-80 overflow-y-auto shadow-2xl transition-transform"
              style={{ backgroundColor: '#061c37' }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-[#061c37] px-4 py-3">
                <span className="text-sm font-semibold text-foreground">
                  Clases
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <LessonCards
                lessons={lessonsState}
                selectedLessonId={selectedLessonId}
                onLessonClick={(id) => {
                  handleCardClick(id);
                  setIsMobileDrawerOpen(false);
                }}
                progress={progress}
                isNavigating={isNavigating}
                setLessonsState={setLessonsState}
                courseId={lesson.courseId}
                userId={userId}
                isMobile={false}
              />
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-0">
          {/* Video Player Section */}
          {lesson.coverVideoKey !== 'none' && (
            <div className="w-full">
              <LessonPlayer
                lesson={lesson}
                progress={progress}
                handleVideoEnd={handleVideoEnd}
                handleProgressUpdate={handleProgressUpdate}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
          )}

          {/* Content Tabs Navigation */}
          <div
            className={`w-full px-4 ${lesson.coverVideoKey === 'none' ? 'mt-12 md:mt-6' : ''}`}
          >
            <LessonContentTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              transcriptionCount={transcription.length}
              resourcesCount={resourcesCount}
              activitiesCount={activities.length}
            />

            {/* Tab Content */}
            <div
              className="mt-2 rounded-xl border border-border p-4"
              style={{ backgroundColor: '#061c37cc' }}
            >
              {activeTab === 'transcription' && (
                <LessonTranscription
                  transcription={transcription}
                  isLoading={isLoadingTranscription}
                  currentTime={currentTime}
                />
              )}

              {activeTab === 'resources' && (
                <LessonResource
                  lessonId={lesson.id}
                  onCountChange={setResourcesCount}
                />
              )}

              {activeTab === 'activities' && (
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
                  lessonCoverVideoKey={lesson.coverVideoKey}
                />
              )}

              {activeTab === 'grades' && (
                <div>
                  <LessonGrades
                    finalGrade={gradeSummary?.finalGrade ?? null}
                    isLoading={isGradesLoading}
                  />
                  <LessonGradeHistoryInline gradeSummary={gradeSummary} />
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-4 w-full px-4 pb-4">
            <LessonComments lessonId={lesson.id} />
          </div>
        </main>
      </div>

      {/* Modal de actividad montado directamente en LessonDetails */}
      {selectedActivityForModal && (
        <LessonActivityModal
          isOpen={isActivityModalOpen}
          onCloseAction={handleActivityModalClose}
          activity={selectedActivityForModal}
          userId={userId}
          onQuestionsAnsweredAction={(allAnswered) => {
            if (
              allAnswered &&
              activities[0]?.id === selectedActivityForModal.id
            ) {
              setIsActivityCompleted(true);
            }
          }}
          markActivityAsCompletedAction={markActivityAsCompletedAction}
          onActivityCompletedAction={handleActivityCompletion}
          savedResults={null}
          onLessonUnlockedAction={handleLessonUnlocked}
          isLastLesson={isLastLesson(lessonsState, lesson.id)}
          courseId={lesson.courseId}
          isLastActivity={isLastActivity(lessonsState, activities, lesson)}
          onViewHistoryAction={() => {}}
          onActivityCompleteAction={() => {
            handleActivityCompletion().catch(console.error);
          }}
          isLastActivityInLesson={
            activities[0]?.id === selectedActivityForModal.id
          }
        />
      )}

      {/* Next Lesson Modal */}
      <NextLessonModal
        nextLesson={(() => {
          const sortedLessons = sortLessons(lessonsState);
          const currentIndex = sortedLessons.findIndex(
            (l) => l.id === lesson.id
          );
          const nextLesson =
            currentIndex >= 0 ? sortedLessons[currentIndex + 1] : null;
          return nextLesson
            ? {
                id: nextLesson.id,
                title: nextLesson.title,
                isLocked: nextLesson.isLocked,
              }
            : null;
        })()}
        courseId={lesson.courseId}
      />

      {/* Chatbot Button and Modal */}
      <StudentChatbot isAlwaysVisible={true} />
    </div>
  );
}
