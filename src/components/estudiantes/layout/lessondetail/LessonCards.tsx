'use client';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
} from 'react';

import { FaCheckCircle, FaClock, FaLock } from 'react-icons/fa';
import { toast } from 'sonner';
import useSWR from 'swr';

import { type LessonWithProgress } from '~/types';
import { extractNumbersFromTitle, sortLessons } from '~/utils/lessonSorting';

interface LessonCardsProps {
  lessonsState: LessonWithProgress[];
  selectedLessonId: number | null;
  onLessonClick: (id: number) => void;
  progress: number;
  isNavigating: boolean;
  setLessonsState: Dispatch<SetStateAction<LessonWithProgress[]>>;
  // Añadir estos props para SWR
  courseId?: number;
  userId?: string;
}

interface NextLessonStatus {
  lessonId: number | null;
  isUnlocked: boolean;
}

interface UnlockResponse {
  success: boolean;
  error?: string;
}

const LessonCards = ({
  lessonsState,
  selectedLessonId,
  onLessonClick,
  progress,
  isNavigating,
  setLessonsState,
  courseId,
  userId,
}: LessonCardsProps) => {
  // SWR para refrescar el estado de las lecciones en tiempo real
  const { data: swrLessons } = useSWR(
    courseId && userId
      ? `/api/lessons/by-course?courseId=${courseId}&userId=${userId}`
      : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al obtener lecciones');
      return (await res.json()) as LessonWithProgress[];
    },
    {
      refreshInterval: 3000, // refresca cada 3 segundos
      revalidateOnFocus: true,
    }
  );

  // Actualiza el estado local cuando SWR obtiene nuevas lecciones
  useEffect(() => {
    if (swrLessons && swrLessons.length > 0) {
      setLessonsState(swrLessons);
    }
  }, [swrLessons, setLessonsState]);

  const checkLessonStatus = useCallback(
    async (lessonId: number) => {
      if (selectedLessonId && progress === 100) {
        try {
          const response = await fetch(
            `/api/lessons/${lessonId}/next-lesson-status`
          );
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = (await response.json()) as NextLessonStatus;

          if (data.isUnlocked && data.lessonId) {
            setLessonsState((prev: LessonWithProgress[]) =>
              prev.map((lesson) =>
                lesson.id === data.lessonId
                  ? { ...lesson, isLocked: false, isNew: true }
                  : lesson
              )
            );
          }
        } catch (error) {
          console.error('Error checking lesson status:', error);
        }
      }
    },
    [selectedLessonId, progress, setLessonsState]
  );

  // Pre-sort lessons once
  const sortedLessons = sortLessons(lessonsState);

  useEffect(() => {
    if (selectedLessonId && progress >= 1) {
      setLessonsState((prev) =>
        prev.map((lesson) =>
          lesson.id === selectedLessonId ? { ...lesson, isNew: false } : lesson
        )
      );
    }
  }, [selectedLessonId, progress, setLessonsState]);

  useEffect(() => {
    const unlockNextLesson = async () => {
      if (!selectedLessonId) return;

      const currentLesson = sortedLessons.find(
        (l) => l.id === selectedLessonId
      );

      if (!currentLesson || currentLesson.porcentajecompletado < 100) return;

      // Encontrar la siguiente lección en secuencia
      const currentNumbers = extractNumbersFromTitle(currentLesson.title);
      let nextLesson: LessonWithProgress | undefined;

      // Buscar la siguiente lección en orden
      for (const lesson of sortedLessons) {
        const lessonNumbers = extractNumbersFromTitle(lesson.title);

        // Verificar si es la siguiente lección en secuencia
        if (
          (lessonNumbers.session === currentNumbers.session &&
            lessonNumbers.class === currentNumbers.class + 1) ||
          (lessonNumbers.session === currentNumbers.session + 1 &&
            lessonNumbers.class === 1)
        ) {
          nextLesson = lesson;
          break;
        }
      }

      if (!nextLesson?.isLocked) return;

      const activities = currentLesson?.activities ?? [];
      const hasActivities = activities.length > 0;
      const shouldUnlock = hasActivities
        ? activities.every((activity) => activity.isCompleted) &&
          currentLesson.porcentajecompletado === 100
        : currentLesson.porcentajecompletado === 100;

      if (shouldUnlock) {
        try {
          const response = await fetch('/api/lessons/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonId: nextLesson.id,
              currentLessonId: selectedLessonId,
              hasActivities,
              allActivitiesCompleted: hasActivities
                ? activities.every((a) => a.isCompleted)
                : true,
            }),
          });

          if (!response.ok) throw new Error('Failed to unlock lesson');

          const result = (await response.json()) as UnlockResponse;
          if (result.success) {
            setLessonsState((prev) =>
              prev.map((lesson) =>
                nextLesson && lesson.id === nextLesson.id
                  ? { ...lesson, isLocked: false, isNew: true }
                  : lesson
              )
            );

            // Solo mostrar el toast una vez después de actualizar el estado
            toast.success('¡Nueva clase desbloqueada!', {
              id: 'lesson-unlocked', // Identificador único para evitar duplicados
              duration: 3000,
            });

            // Remover el toast del checkLessonStatus
            await checkLessonStatus(selectedLessonId);
          }
        } catch (error) {
          console.error('Error unlocking next lesson:', error);
          toast.error('Error al desbloquear la siguiente clase');
        }
      }
    };

    // Debounce la ejecución para evitar múltiples llamadas
    const timeoutId = setTimeout(() => {
      void unlockNextLesson();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedLessonId, sortedLessons, checkLessonStatus, setLessonsState]);

  const getActivityStatus = (lessonItem: LessonWithProgress) => {
    // Siempre usar el estado isLocked de la base de datos
    if (lessonItem.isLocked) {
      return {
        icon: <FaLock className="text-gray-400" />,
        isAccessible: false,
        className: 'cursor-not-allowed bg-gray-50/95 opacity-75 shadow-sm',
      };
    }

    // Si no está bloqueada, verificar si está completada
    if (lessonItem.porcentajecompletado === 100) {
      return {
        icon: <FaCheckCircle className="text-green-500" />,
        isAccessible: true,
        className:
          'cursor-pointer bg-white/95 shadow-sm hover:bg-gray-50 transition-colors duration-200 active:scale-[0.98] active:transition-transform',
      };
    }

    // Desbloqueada pero no completada
    return {
      icon: <FaClock className="text-gray-400" />,
      isAccessible: true,
      className:
        'cursor-pointer bg-white/95 shadow-sm hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] active:transition-transform',
    };
  };

  const handleClick = (lessonItem: LessonWithProgress) => {
    if (isNavigating) return;
    // Usar directamente isLocked de la base de datos
    if (!lessonItem.isLocked) {
      onLessonClick(lessonItem.id);
    } else {
      toast.error('Clase Bloqueada', {
        description: 'Completa la actividad anterior y desbloquea esta clase.',
      });
    }
  };

  const truncateDescription = (description: string | null, maxLength = 50) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength).trim();
  };

  const truncateTitle = (title: string) => {
    if (title.length <= 18) return title;
    return title.slice(0, 18).trim();
  };

  const renderProgressBar = (lessonItem: LessonWithProgress) => {
    const isCurrentLesson = lessonItem.id === selectedLessonId;
    let currentProgress;

    if (isCurrentLesson) {
      // Si estamos navegando o es una nueva lección seleccionada,
      // mostrar el progreso real y no el heredado
      currentProgress = isNavigating ? 0 : progress;
    } else {
      // Para las otras lecciones, mostrar su progreso almacenado
      currentProgress = lessonItem.porcentajecompletado;
    }

    return (
      <div className="relative h-2 rounded bg-gray-200">
        <div
          className="absolute h-2 rounded bg-blue-500 transition-all duration-300 ease-in-out"
          style={{
            width: `${currentProgress}%`,
          }}
        />
      </div>
    );
  };

  const renderLessonCard = (lessonItem: LessonWithProgress) => {
    const isCurrentLesson = lessonItem.id === selectedLessonId;
    const status = getActivityStatus(lessonItem);
    const shouldShowNew =
      lessonItem.isLocked === false &&
      lessonItem.isNew &&
      (isCurrentLesson
        ? progress === 0
        : lessonItem.porcentajecompletado === 0);

    // Calcular el progreso a mostrar
    const displayProgress = isCurrentLesson
      ? isNavigating
        ? 0
        : progress
      : lessonItem.porcentajecompletado;

    return (
      <div
        key={lessonItem.id}
        onClick={() => handleClick(lessonItem)}
        className={`relative rounded-lg p-4 transition-all duration-200 ease-in-out ${
          isNavigating ? 'cursor-not-allowed opacity-50' : ''
        } ${status.className} ${
          isCurrentLesson
            ? 'z-20 border-l-8 border-blue-500 bg-blue-50/95 shadow-md'
            : ''
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3
            className={`max-w-[calc(100%-4rem)] truncate font-semibold ${
              status.isAccessible ? 'text-gray-900' : 'text-gray-500'
            }`}
            title={lessonItem.title}
          >
            {truncateTitle(lessonItem.title)}
          </h3>
          <div className="flex items-center space-x-2">
            {shouldShowNew && (
              <span className="relative [animation:nuevo-badge-pulse_1.5s_infinite_ease-in-out] rounded bg-green-500 px-2 py-1 text-xs text-white">
                Nueva
              </span>
            )}
            {status.icon}
          </div>
        </div>
        <p className="mb-2 line-clamp-1 text-sm text-gray-600">
          {truncateDescription(lessonItem.description)}
        </p>
        {renderProgressBar(lessonItem)}
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{lessonItem.duration} mins</span>
          <span>{displayProgress}%</span>
        </div>
      </div>
    );
  };

  // Agregar un estado de carga inicial
  const hasLessons = lessonsState.length > 0;

  // Renderizar un esqueleto mientras no hay lecciones
  if (!hasLessons) {
    return (
      <div className="lesson-cards-container relative z-10 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg bg-gray-100 p-4 shadow-sm"
          >
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
            <div className="mb-4 h-3 w-1/2 rounded bg-gray-200" />
            <div className="h-2 w-full rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="lesson-cards-container relative z-10 space-y-2">
      {sortedLessons.map((lesson) => (
        <div
          key={lesson.id}
          className="relative transition-transform will-change-transform"
        >
          {renderLessonCard(lesson)}
        </div>
      ))}
    </div>
  );
};

export default LessonCards;
