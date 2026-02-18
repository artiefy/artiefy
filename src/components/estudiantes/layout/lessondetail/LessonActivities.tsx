import { useCallback, useEffect, useState } from 'react';

import { BookOpen, CircleHelp, Clock, FileUp, Rocket } from 'lucide-react';
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaLock,
} from 'react-icons/fa';
import { TbClockFilled } from 'react-icons/tb';
import { toast } from 'sonner';
import useSWR from 'swr';

import { Icons } from '~/components/estudiantes/ui/icons';
import { completeActivity } from '~/server/actions/estudiantes/progress/completeActivity';
import { sortLessons } from '~/utils/lessonSorting';
import { useMediaQuery } from '~/utils/useMediaQuery';

import { LessonActivityModal } from './LessonActivityModal';
import { GradeHistory } from './LessonGradeHistory';

import type { Activity, Lesson, SavedAnswer } from '~/types';

import '~/styles/arrowclass.css';

interface LessonActivitiesProps {
  activities: Activity[];
  isVideoCompleted: boolean;
  isActivityCompleted: boolean;
  handleActivityCompletion: () => Promise<void>;
  userId: string;
  onLessonUnlocked: (lessonId: number) => void;
  courseId: number;
  lessonId: number;
  isLastLesson: boolean;
  isLastActivity: boolean;
  lessons: { id: number; title: string; coverVideoKey?: string }[];
  activityModalId?: number;
  inMainContent?: boolean; // Nuevo prop para indicar si está en el contenido principal
  lessonCoverVideoKey?: string; // Add this prop to receive the current lesson's coverVideoKey
}

interface SavedResults {
  score: number;
  answers: Record<string, SavedAnswer>;
  isAlreadyCompleted?: boolean;
}

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

interface GradeSummaryResponse {
  finalGrade: number;
  courseCompleted?: boolean;
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

const isValidGradeSummaryResponse = (
  data: unknown
): data is GradeSummaryResponse => {
  if (!data || typeof data !== 'object') return false;

  const response = data as Partial<GradeSummaryResponse>;

  return (
    typeof response.finalGrade === 'number' &&
    Array.isArray(response.parameters) &&
    response.parameters.every(
      (param) =>
        typeof param.name === 'string' &&
        typeof param.grade === 'number' &&
        typeof param.weight === 'number' &&
        Array.isArray(param.activities) &&
        param.activities.every(
          (act) =>
            typeof act.id === 'number' &&
            typeof act.name === 'string' &&
            typeof act.grade === 'number'
        )
    )
  );
};

const fetchGradeData = async (url: string): Promise<GradeSummaryResponse> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch grades');

  const rawData: unknown = await response.json();

  if (!isValidGradeSummaryResponse(rawData)) {
    throw new Error('Invalid grade summary response format');
  }

  return rawData;
};

interface ActivityTypeMeta {
  label: string;
  icon: typeof BookOpen;
  color: string;
  bg: string;
}

const resolveActivityType = (activity: Activity): ActivityTypeMeta => {
  const lowerName = activity.typeActi?.name?.toLowerCase?.() ?? '';
  const byId = activity.typeid;

  if (
    lowerName.includes('quiz') ||
    lowerName.includes('cuestion') ||
    byId === 2
  ) {
    return {
      label: 'Cuestionario',
      icon: CircleHelp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
    };
  }

  if (
    lowerName.includes('document') ||
    lowerName.includes('entrega') ||
    byId === 1
  ) {
    return {
      label: 'Entrega',
      icon: FileUp,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
    };
  }

  if (
    lowerName.includes('proyecto') ||
    lowerName.includes('avance') ||
    byId === 3
  ) {
    return {
      label: 'Autocompletado',
      icon: Rocket,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
    };
  }

  return {
    label: activity.typeActi?.name ?? 'Actividad',
    icon: BookOpen,
    color: 'text-sky-400',
    bg: 'bg-sky-500/20',
  };
};

const formatDeadline = (value: Activity['fechaMaximaEntrega']) => {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

interface ActivityAnswersResponse {
  score: number;
  answers: Record<string, SavedAnswer>;
  isAlreadyCompleted: boolean;
}

interface ActivityState {
  savedResults: SavedResults | null;
  isLoading: boolean;
  isCompleted: boolean;
}

const LessonActivities = ({
  activities = [],
  isVideoCompleted,
  isActivityCompleted: propIsActivityCompleted, // Rename to avoid confusion
  handleActivityCompletion: onActivityCompleted, // Rename the prop to avoid duplicate
  userId,
  onLessonUnlocked,
  courseId,
  lessonId,
  isLastLesson,
  isLastActivity,
  lessons,
  activityModalId,
  inMainContent = false, // Valor por defecto
  lessonCoverVideoKey, // Receive the prop
}: LessonActivitiesProps) => {
  const [activitiesState, setActivitiesState] = useState<
    Record<number, ActivityState>
  >({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [isGradeHistoryOpen, setIsGradeHistoryOpen] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(true);
  const [_isGradesLoading, setIsGradesLoading] = useState(true);
  const [gradeSummary, setGradeSummary] = useState<CourseGradeSummary | null>(
    null
  );
  // Add underscore prefix to mark as intentionally unused local state
  const [_isActivityCompleted, setIsActivityCompleted] = useState(
    propIsActivityCompleted
  );
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showAll, setShowAll] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleQuestionsAnswered = () => {
    if (selectedActivity) {
      const currentIndex = activities.indexOf(selectedActivity);
      const nextActivity = activities[currentIndex + 1];

      setActivitiesState((prev) => ({
        ...prev,
        [selectedActivity.id]: {
          ...prev[selectedActivity.id],
          isCompleted: true,
        },
        ...(nextActivity && {
          [nextActivity.id]: { ...prev[nextActivity.id], isCompleted: false },
        }),
      }));
    }
  };

  const markActivityAsCompleted = async (): Promise<void> => {
    if (selectedActivity) {
      setActivitiesState((prev) => ({
        ...prev,
        [selectedActivity.id]: {
          ...prev[selectedActivity.id],
          isCompleted: true,
        },
      }));
    }
    return Promise.resolve();
  };

  const { data: grades } = useSWR<GradeSummaryResponse>(
    courseId && userId
      ? `/api/grades/summary?courseId=${courseId}&userId=${userId}`
      : null,
    fetchGradeData,
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (grades) {
      setGradeSummary({
        finalGrade: grades.finalGrade,
        courseCompleted: grades.isCompleted,
        parameters: grades.parameters,
      });
      setIsGradesLoading(false);
    }
  }, [grades]);

  const isActivityAnswersResponse = (
    data: unknown
  ): data is ActivityAnswersResponse => {
    if (!data || typeof data !== 'object') return false;

    const response = data as Partial<ActivityAnswersResponse>;
    return (
      typeof response.score === 'number' &&
      typeof response.answers === 'object' &&
      response.answers !== null &&
      typeof response.isAlreadyCompleted === 'boolean'
    );
  };

  useEffect(() => {
    const checkActivitiesStatus = async () => {
      if (!activities.length) {
        setIsButtonLoading(false);
        return;
      }

      setIsButtonLoading(true);
      try {
        const activityPromises = activities
          .slice(0, 3)
          .map(async (activity) => {
            const response = await fetch(
              `/api/activities/getAnswers?activityId=${activity.id}&userId=${userId}`
            );

            if (!response.ok) {
              return null;
            }

            const rawData: unknown = await response.json();
            if (isActivityAnswersResponse(rawData)) {
              return {
                activityId: activity.id,
                state: {
                  savedResults: {
                    score: rawData.score,
                    answers: rawData.answers,
                    isAlreadyCompleted: rawData.isAlreadyCompleted,
                  },
                  isLoading: false,
                  isCompleted: rawData.isAlreadyCompleted,
                },
              };
            }
            return null;
          });

        const results = await Promise.all(activityPromises);
        const newActivitiesState: Record<number, ActivityState> = {};

        results.forEach((result) => {
          if (result) {
            newActivitiesState[result.activityId] = result.state;
          }
        });

        // Update state only once with all results
        setActivitiesState((prev) => ({
          ...prev,
          ...newActivitiesState,
        }));
      } catch (error) {
        console.error('Error checking activities status:', error);
      } finally {
        setIsButtonLoading(false);
      }
    };

    void checkActivitiesStatus();
  }, [activities, userId]); // Only depend on activities and userId

  const handleCompletedActivityClick = async (activity: Activity) => {
    try {
      setActivitiesState((prev) => ({
        ...prev,
        [activity.id]: { ...prev[activity.id], isLoading: true },
      }));

      const response = await fetch(
        `/api/activities/getAnswers?activityId=${activity.id}&userId=${userId}`
      );

      if (response.ok) {
        const rawData: unknown = await response.json();
        if (isActivityAnswersResponse(rawData)) {
          setActivitiesState((prev) => ({
            ...prev,
            [activity.id]: {
              savedResults: {
                score: rawData.score,
                answers: rawData.answers,
                isAlreadyCompleted: true,
              },
              isLoading: false,
              isCompleted: true,
            },
          }));
        }
      }
      setSelectedActivity(activity);
      openModal();
    } catch (e) {
      console.error('Error fetching results:', e);
      toast.error('Error al cargar los resultados');
    }
  };

  const handleOpenActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setActivitiesState((prev) => ({
      ...prev,
      [activity.id]: {
        ...prev[activity.id],
        savedResults: null,
        isLoading: false,
      },
    }));

    openModal();
  };

  const isLastActivityInLesson = (currentActivity: Activity) => {
    if (!activities.length) return false;
    const activityIndex = activities.indexOf(currentActivity);
    return activityIndex === activities.length - 1;
  };

  const handleModalClose = () => {
    if (!selectedActivity) {
      closeModal();
      return;
    }

    const currentActivity = selectedActivity;
    closeModal();

    // Al cerrar sin completar, limpiar loading pero no marcar completada
    setActivitiesState((prev) => ({
      ...prev,
      [currentActivity.id]: {
        ...(prev[currentActivity.id] || {}),
        isLoading: false,
      },
    }));

    setSelectedActivity(null);
  };

  const getButtonClasses = (activity: Activity, isLocked: boolean) => {
    const activityState = activitiesState[activity.id];

    if (isButtonLoading) {
      return 'bg-slate-500/20 text-slate-200 border-slate-400/20';
    }

    if (activityState?.isCompleted) {
      return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30 active:scale-95';
    }

    if (isLocked) {
      return 'bg-[#0d223f] text-[#8fb5ff] border-[#1c355c] hover:bg-[#0f284c] cursor-not-allowed';
    }

    return 'bg-[#13315c] text-[#e0f0ff] border-[#1f4a7a] hover:bg-[#16406d] active:scale-95';
  };

  const getButtonLabel = (activity: Activity, isLocked: boolean) => {
    const activityState = activitiesState[activity.id];

    if (isButtonLoading) {
      return (
        <div className="flex items-center gap-2">
          <Icons.spinner className="h-4 w-4 text-gray-800" />
          <span className="font-semibold text-gray-800">Cargando...</span>
        </div>
      );
    }

    if (activityState?.isCompleted && activityState?.savedResults) {
      return (
        <>
          {activityState.isLoading && (
            <Icons.spinner className="mr-2 h-4 w-4" />
          )}
          <span className="font-semibold">
            {activity.typeid === 1 ? 'Ver Documento' : 'Ver Resultados'}
          </span>
          <FaCheckCircle className="ml-2 inline text-white" />
        </>
      );
    }

    return (
      <>
        {activityState?.isLoading && <Icons.spinner className="mr-2 h-4 w-4" />}
        {isLocked ? (
          <span className="flex items-center gap-2 font-semibold">
            <FaLock className="h-4 w-4" />
            Bloqueada
          </span>
        ) : (
          <span className="font-semibold">Ver Actividad</span>
        )}
      </>
    );
  };

  const getActivityStatus = (activity: Activity, _index: number) => {
    const activityState = activitiesState[activity.id];

    if (isButtonLoading) {
      return {
        icon: <TbClockFilled className="text-gray-400" />,
        bgColor: 'bg-gray-200',
        isActive: false,
      };
    }

    if (activityState?.isCompleted) {
      return {
        icon: <FaCheckCircle className="text-green-500" />,
        bgColor: 'bg-green-100',
        isActive: true,
      };
    }

    return {
      icon: <TbClockFilled className="text-blue-500" />,
      bgColor: 'bg-blue-100',
      isActive: true,
    };
  };

  const _shouldShowArrows = (activity: Activity, index: number) => {
    const currentLesson = activity.lessonsId
      ? lessons.find((l) => l.id === activity.lessonsId)
      : null;
    const hasNoVideo = currentLesson?.coverVideoKey === 'none';

    if (!isVideoCompleted && !hasNoVideo) return false;
    if (activitiesState[activity.id]?.isCompleted) return false;

    // Show arrows if this activity is unlocked but not completed
    const previousActivity = activities[index - 1];
    const isPreviousCompleted = previousActivity
      ? activitiesState[previousActivity.id]?.isCompleted
      : true; // First activity is considered to have "completed previous"

    return isPreviousCompleted;
  };

  const truncateDescription = (description: string | null, maxLength = 60) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength).trim() + '...';
  };

  const _getNextAvailableLessonId = useCallback(() => {
    if (!lessons || lessons.length === 0) return undefined;
    const sorted = sortLessons(lessons);
    const currentIndex = sorted.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1 || currentIndex === sorted.length - 1)
      return undefined;
    return sorted[currentIndex + 1]?.id;
  }, [lessons, lessonId]);

  const renderActivityCard = (activity: Activity, index: number) => {
    const activityState = activitiesState[activity.id];
    const status = getActivityStatus(activity, index);
    const activityType = resolveActivityType(activity);
    const ActivityIcon = activityType.icon;
    const deadlineText = formatDeadline(activity.fechaMaximaEntrega);
    const currentLesson = activity.lessonsId
      ? lessons.find((l) => l.id === activity.lessonsId)
      : null;
    const canAccess = true;
    const _isNextLessonAvailable =
      !isLastLesson && isLastActivityInLesson(activity);
    const isLocked = false;

    return (
      <div
        key={activity.id}
        className="flex w-full justify-center md:w-[70%] md:justify-start"
      >
        <div
          className={`group mb-4 w-11/12 max-w-md rounded-2xl border px-5 py-4 transition-all md:w-full md:max-w-none ${activityType.bg} ${
            isButtonLoading
              ? 'border-border/40'
              : status.isActive
                ? 'border-border/50 hover:border-border'
                : 'border-border/40 opacity-60'
          }`}
        >
          <div className="flex w-full flex-col items-center justify-between gap-4 text-center md:flex-row md:items-center md:text-left">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2 md:flex-row md:gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${activityType.bg} ${activityType.color}`}
              >
                <ActivityIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-center gap-1 md:items-start md:gap-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${activityType.color} ${activityType.bg}`}
                >
                  {activityType.label}
                </span>
                {deadlineText && activity.typeid !== 2 && (
                  <span
                    className="flex items-center gap-1 truncate rounded-md border px-2 py-0.5 text-xs font-medium"
                    style={{
                      borderColor: '#1d283a33',
                      background: '#1d283a0f',
                      color: '#1d283a',
                      maxWidth: '160px',
                    }}
                    title={deadlineText}
                  >
                    <Clock className="h-3 w-3" />
                    {deadlineText}
                  </span>
                )}
                {/* Mostrar duración de vídeo si está disponible en la lección */}
                {currentLesson && (currentLesson as Lesson).videoDuration && (
                  <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                    Duración: {(currentLesson as Lesson).videoDuration}
                  </span>
                )}
                <h4 className="text-center text-sm font-medium text-foreground md:text-left">
                  {activity.name}
                </h4>
                <p className="line-clamp-1 text-center text-xs text-muted-foreground md:text-left">
                  {truncateDescription(activity.description)}
                </p>
              </div>
            </div>
            <div className="flex justify-center md:self-center">
              <button
                onClick={
                  activityState?.isCompleted
                    ? () => handleCompletedActivityClick(activity)
                    : () => handleOpenActivity(activity)
                }
                disabled={!activityState?.isCompleted && isButtonLoading}
                className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all ${getButtonClasses(activity, isLocked)} ${
                  !canAccess && !isButtonLoading && !activityState?.isCompleted
                    ? 'cursor-not-allowed'
                    : ''
                } disabled:pointer-events-none disabled:opacity-50`}
              >
                {getButtonLabel(activity, isLocked)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (activityModalId && activities.some((a) => a.id === activityModalId)) {
      const activity = activities.find((a) => a.id === activityModalId);
      if (activity) {
        setSelectedActivity(activity);
        setIsModalOpen(true);
      }
    }
    // Si el id no es válido o no hay actividad, cerrar el modal
    if (!activityModalId) {
      setIsModalOpen(false);
      setSelectedActivity(null);
    }
  }, [activityModalId, activities]);

  // Add a more robust event listener for the custom event
  useEffect(() => {
    const handleCustomEvent = (event: Event) => {
      if (
        'detail' in event &&
        typeof event.detail === 'object' &&
        event.detail !== null
      ) {
        const customEvent = event as CustomEvent<{ activityId: number }>;
        const activityId = customEvent.detail?.activityId;

        // Only process if it's a valid activity ID
        if (activityId && activities.some((a) => a.id === activityId)) {
          const activity = activities.find((a) => a.id === activityId);
          if (activity) {
            setSelectedActivity(activity);
            setIsModalOpen(true);
          }
        }
      }
    };

    window.addEventListener('open-activity-modal', handleCustomEvent);
    return () => {
      window.removeEventListener('open-activity-modal', handleCustomEvent);
    };
  }, [activities]);

  // Handle activity completion event
  const handleActivityCompletion = async () => {
    if (!activities.length) return;

    try {
      await completeActivity(activities[0].id, userId);
      setIsActivityCompleted(true);

      // Verificar si todas las actividades están completadas
      const allActivitiesCompleted = activities.every(
        (activity) =>
          activitiesState[activity.id]?.isCompleted ||
          activity.id === activities[0].id
      );

      if (allActivitiesCompleted) {
        const canSyncLessonProgress =
          lessonCoverVideoKey === 'none' || isVideoCompleted;

        if (canSyncLessonProgress) {
          // Actualizar progreso de la lección a 100% cuando no hay video o ya fue completado
          const lessonProgressResponse = await fetch(
            '/api/lessons/update-progress',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lessonId,
                progress: 100,
                allActivitiesCompleted: true,
              }),
            }
          );

          if (lessonProgressResponse.ok) {
            toast.success(
              '¡Todas las actividades completadas! Clase finalizada.'
            );
          }
        } else {
          toast.success('¡Actividades completadas! Ahora termina el video.');
        }
      } else {
        toast.success('¡Actividad completada!');
      }

      // Call the parent component's handler to update the parent state
      await onActivityCompleted();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al completar la actividad');
    }
  };

  return (
    <div
      className={
        inMainContent
          ? 'w-full bg-transparent p-0'
          : isMobile
            ? 'm-0 w-full rounded-none bg-transparent p-0'
            : 'max-h-[70vh] w-full overflow-y-auto p-2 md:max-h-none md:max-w-full md:min-w-[400px] md:overflow-visible md:p-4'
      }
      style={
        isMobile || inMainContent
          ? {
              maxHeight: 'none',
              overflow: 'visible',
              boxShadow: 'none',
              borderRadius: 0,
              background: 'transparent',
            }
          : undefined
      }
    >
      {/* Progress Circle */}
      {activities.length > 0 && !inMainContent && (
        <div className="mb-6 flex items-center justify-start gap-4">
          <div className="relative">
            <svg className="h-20 w-20 -rotate-90 transform">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#1d283a"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(activities.filter((a) => activitiesState[a.id]?.isCompleted).length / activities.length) * 213.6} 213.6`}
                className="text-accent transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-foreground">
                {Math.round(
                  (activities.filter((a) => activitiesState[a.id]?.isCompleted)
                    .length /
                    activities.length) *
                    100
                )}
                %
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {
                activities.filter((a) => activitiesState[a.id]?.isCompleted)
                  .length
              }{' '}
              de {activities.length} completadas
            </span>
            <span className="text-xs text-muted-foreground">
              Progreso de actividades
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2
          className={`mb-4 font-bold text-primary ${
            isMobile || inMainContent ? 'px-2 text-lg' : 'text-xl md:text-2xl'
          }`}
        >
          {inMainContent ? 'Contenido de la Clase' : ''}
        </h2>
        {/* Botón de retraer/expandir solo en móvil */}
        {isMobile && !inMainContent && (
          <button
            className="-mt-5 mr-2 flex items-center rounded px-2 py-1 text-blue-600 hover:bg-blue-50 active:scale-95"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={
              collapsed ? 'Expandir actividades' : 'Ocultar actividades'
            }
          >
            {collapsed ? (
              <>
                <FaChevronDown className="inline" />
                <span className="text-md ml-1 font-bold text-blue-500">
                  Mostrar
                </span>
              </>
            ) : (
              <>
                <FaChevronUp className="inline" />
                <span className="text-md ml-1 font-bold text-blue-500">
                  Ocultar
                </span>
              </>
            )}
          </button>
        )}
      </div>
      {/* Botón para expandir/retraer tarjetas (solo si no está colapsado) */}
      {!collapsed && activities.length > 3 && (
        <div className="mb-2 flex justify-end px-1">
          <button
            className="flex items-center gap-1 rounded px-2 py-1 text-sm font-semibold text-blue-600 hover:bg-blue-50 active:scale-95"
            onClick={() => setShowAll((prev) => !prev)}
            aria-expanded={showAll}
            aria-label={
              showAll ? 'Mostrar menos actividades' : 'Mostrar más actividades'
            }
          >
            {showAll ? (
              <>
                Mostrar menos <FaChevronLeft className="inline" />
              </>
            ) : (
              <>
                Mostrar más <FaChevronRight className="inline" />
              </>
            )}
          </button>
        </div>
      )}
      {/* Activities section */}
      {!collapsed ? (
        activities.length > 0 && !inMainContent ? (
          <div className={`space-y-4 ${isMobile ? 'space-y-2' : ''}`}>
            {(showAll ? activities : activities.slice(0, 3)).map(
              (activity, index) => renderActivityCard(activity, index)
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <p className="text-gray-600">No hay actividades disponibles</p>
          </div>
        )
      ) : null}

      {/* Rest of the component */}
      {/* Grades section removed as it's in the menu */}
      {/* Resources section removed as it's in the menu */}

      {/* Siempre renderizar el modal independientemente de inMainContent */}
      {selectedActivity && (
        <LessonActivityModal
          isOpen={isModalOpen}
          onCloseAction={handleModalClose}
          activity={selectedActivity}
          onQuestionsAnsweredAction={handleQuestionsAnswered}
          userId={userId}
          markActivityAsCompletedAction={markActivityAsCompleted}
          onActivityCompletedAction={handleActivityCompletion}
          courseId={courseId}
          savedResults={activitiesState[selectedActivity.id]?.savedResults}
          onLessonUnlockedAction={onLessonUnlocked}
          isLastLesson={isLastLesson}
          isLastActivity={isLastActivity}
          onViewHistoryAction={() => setIsGradeHistoryOpen(true)}
          onActivityCompleteAction={handleActivityCompletion}
          isLastActivityInLesson={isLastActivityInLesson(selectedActivity)}
        />
      )}

      <GradeHistory
        isOpen={isGradeHistoryOpen}
        onClose={() => setIsGradeHistoryOpen(false)}
        gradeSummary={gradeSummary}
      />
    </div>
  );
};

export default LessonActivities;
