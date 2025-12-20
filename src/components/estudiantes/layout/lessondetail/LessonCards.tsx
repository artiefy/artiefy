'use client';
import { type Dispatch, type SetStateAction, useEffect } from 'react';

import Link from 'next/link';

import { FaCheckCircle, FaClock, FaLock } from 'react-icons/fa';
import { toast } from 'sonner';
import useSWR from 'swr';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/estudiantes/ui/select';
import { ClassMeeting } from '~/types';
import { sortLessons } from '~/utils/lessonSorting';

import type { LessonWithProgress } from '~/types';

interface LessonCardsProps {
  lessons: LessonWithProgress[];
  selectedLessonId: number | null;
  onLessonClick: (id: number) => void;
  progress: number;
  isNavigating: boolean;
  setLessonsState: Dispatch<SetStateAction<LessonWithProgress[]>>;
  // Añadir estos props para SWR
  courseId?: number;
  userId?: string;
  isMobile?: boolean; // <-- nuevo prop
}

interface UnlockResponse {
  success: boolean;
  nextLessonId?: number;
  error?: string;
}

const LessonCards = ({
  lessons,
  selectedLessonId,
  onLessonClick,
  progress,
  isNavigating,
  setLessonsState,
  courseId,
  userId,
  isMobile = false,
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

  // Ordenar las lecciones por orderIndex (puede ser null)
  const orderedLessons = sortLessons(lessons);

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

      const currentLesson = orderedLessons.find(
        (l) => l.id === selectedLessonId
      );
      if (!currentLesson) return;

      const activities = currentLesson.activities ?? [];
      const hasActivities = activities.length > 0;
      const isVideoLesson = currentLesson.coverVideoKey !== 'none';

      // Determine if we should attempt to unlock the next lesson
      const allActivitiesCompleted = hasActivities
        ? activities.every((a) => a.isCompleted)
        : false;

      const shouldUnlock =
        // Video lesson completed (and activities completed if present)
        (isVideoLesson &&
          currentLesson.porcentajecompletado === 100 &&
          (!hasActivities || allActivitiesCompleted)) ||
        // No video but has activities and they're all completed
        (!isVideoLesson && hasActivities && allActivitiesCompleted) ||
        // Neither video nor activities => unlock automatically
        (!isVideoLesson && !hasActivities);

      if (!shouldUnlock) return;

      // Find the next lesson to ensure we update state after server unlock
      const currentIndex = orderedLessons.findIndex(
        (l) => l.id === selectedLessonId
      );
      const nextLesson =
        currentIndex >= 0 ? orderedLessons[currentIndex + 1] : undefined;
      if (!nextLesson?.isLocked) return;

      try {
        const res = await fetch('/api/lessons/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentLessonId: selectedLessonId,
            hasActivities,
            allActivitiesCompleted,
          }),
        });

        const result = (await res.json()) as UnlockResponse;
        if (!res.ok || !result.success) {
          throw new Error(result.error ?? 'Failed to unlock next lesson');
        }

        // Update state to reflect unlocked lesson from DB
        setLessonsState((prev) =>
          prev.map((lesson) =>
            result.nextLessonId && lesson.id === result.nextLessonId
              ? { ...lesson, isLocked: false, isNew: true }
              : lesson
          )
        );

        toast.success('¡Nueva clase desbloqueada!', {
          id: 'lesson-unlocked',
          duration: 3000,
        });
      } catch (error) {
        console.error('Error unlocking next lesson:', error);
        toast.error('Error al desbloquear la siguiente clase');
      }
    };

    const timeoutId = setTimeout(() => {
      void unlockNextLesson();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedLessonId, orderedLessons, setLessonsState]);

  const getActivityStatus = (lessonItem: LessonWithProgress) => {
    // Siempre usar el estado isLocked de la base de datos
    if (lessonItem.isLocked) {
      return {
        icon: <FaLock className="text-gray-400" />,
        isAccessible: false,
        className: 'cursor-not-allowed bg-gray-50/95 opacity-75 shadow-sm',
      };
    }

    const hasVideo =
      !!lessonItem.coverVideoKey && lessonItem.coverVideoKey !== 'none';
    const hasActivities = (lessonItem.activities?.length ?? 0) > 0;
    const activitiesCompleted =
      lessonItem.activities?.every(
        (a) => a.isCompleted || (a.userProgress ?? 0) >= 100
      ) ?? false;

    // Determinar si la clase está considerada completa:
    // - Si tiene video: completada cuando porcentajecompletado === 100 y (si tiene actividades, además que todas las actividades estén completadas)
    // - Si no tiene video pero sí actividades: completada cuando todas las actividades están completadas
    // - Si no tiene video ni actividades: no está completada
    const completed = hasVideo
      ? lessonItem.porcentajecompletado === 100 &&
        (!hasActivities || activitiesCompleted)
      : hasActivities
        ? activitiesCompleted
        : false;

    if (completed) {
      return {
        icon: <FaCheckCircle className="text-green-500" />,
        isAccessible: true,
        className:
          'cursor-pointer bg-white/95 shadow-sm hover:bg-gray-50 transition-colors duration-200 active:scale-[0.98] active:transition-transform',
      };
    }

    // Si hay video y no está completado => mostrar reloj
    // Si no hay video pero hay actividad y no está completada => mostrar reloj también (pendiente)
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
    const activitiesCompleted =
      lessonItem.activities?.some(
        (a) => a.isCompleted || (a.userProgress ?? 0) > 0
      ) ?? false;

    const hasSeenOrInteracted =
      (isCurrentLesson ? progress > 0 : lessonItem.porcentajecompletado > 0) ||
      activitiesCompleted;

    const shouldShowNew =
      lessonItem.isLocked === false && lessonItem.isNew && !hasSeenOrInteracted;

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
  const hasLessons = lessons.length > 0;

  // Renderizar un esqueleto mientras no hay lecciones
  if (!hasLessons) {
    return (
      <div className="lesson-cards-container relative z-10 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg bg-gray-100 p-3 shadow-sm md:h-32 md:p-4"
          >
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
            <div className="mb-4 h-3 w-1/2 rounded bg-gray-200" />
            <div className="h-2 w-full rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  // Si aquí se mapean varias lecciones, asegúrate de ordenarlas así:
  const sortedLessons = orderedLessons
    ?.slice()
    .sort(
      (a, b) =>
        (a.orderIndex ?? 1e9) - (b.orderIndex ?? 1e9) ||
        (a.id ?? 0) - (b.id ?? 0)
    );

  // Renderizar select en móvil
  if (isMobile) {
    return (
      <div className="mb-4">
        <Select
          value={selectedLessonId ? String(selectedLessonId) : undefined}
          onValueChange={(val) => {
            const id = Number(val);
            if (!isNaN(id)) onLessonClick(id);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una clase" />
          </SelectTrigger>
          <SelectContent>
            {sortedLessons.map((lesson) => {
              const isCurrentLesson = lesson.id === selectedLessonId;
              const activitiesCompleted =
                lesson.activities?.some(
                  (a) => a.isCompleted || (a.userProgress ?? 0) > 0
                ) ?? false;

              const hasSeenOrInteracted =
                (isCurrentLesson
                  ? progress > 0
                  : lesson.porcentajecompletado > 0) || activitiesCompleted;

              const shouldShowNew =
                lesson.isLocked === false &&
                lesson.isNew &&
                !hasSeenOrInteracted;

              const status = getActivityStatus(lesson);

              return (
                <SelectItem key={lesson.id} value={String(lesson.id)}>
                  <span className="flex items-center gap-2">
                    {status.icon}
                    <span className="truncate">{lesson.title}</span>
                    {/* Badge Nueva */}
                    {shouldShowNew && (
                      <span className="ml-2 rounded bg-green-500 px-2 py-0.5 text-xs text-white">
                        Nueva
                      </span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="lesson-cards-container relative z-10 max-h-[60vh] space-y-2 overflow-y-auto md:max-h-none md:overflow-visible">
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

// Recibe las clases grabadas como prop
export function LessonCardsRecorded({
  recordedMeetings,
}: {
  recordedMeetings: ClassMeeting[];
}) {
  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-green-700">Clases Grabadas</h2>
      <div className="space-y-3">
        {recordedMeetings.map((meeting: ClassMeeting) => (
          <div key={meeting.id} className="rounded border bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{meeting.title}</span>
              <Link href={`/estudiantes/clases/${meeting.id}`}>
                <button className="buttonclass text-background transition-none active:scale-95">
                  Ver Clase
                </button>
              </Link>
            </div>
            <video
              controls
              className="mt-2 w-full max-w-lg rounded shadow"
              src={`https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${meeting.video_key ?? ''}`}
            >
              Tu navegador no soporta el video.
            </video>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LessonCards;
