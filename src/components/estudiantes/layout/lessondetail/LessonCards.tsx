'use client';
import { type Dispatch, type SetStateAction, useEffect } from 'react';

import Link from 'next/link';

import { FaCheckCircle, FaClock, FaLock } from 'react-icons/fa';
import { SiGoogleclassroom } from 'react-icons/si';
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

const isLessonCompleted = (lessonItem: LessonWithProgress) => {
  const hasVideo =
    !!lessonItem.coverVideoKey && lessonItem.coverVideoKey !== 'none';
  const hasActivities = (lessonItem.activities?.length ?? 0) > 0;
  const activitiesCompleted =
    lessonItem.activities?.every(
      (activity) => activity.isCompleted || (activity.userProgress ?? 0) >= 100
    ) ?? false;

  return hasVideo
    ? lessonItem.porcentajecompletado === 100 &&
        (!hasActivities || activitiesCompleted)
    : hasActivities
      ? activitiesCompleted
      : false;
};

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

    const completed = isLessonCompleted(lessonItem);

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

  const renderLessonCard = (lessonItem: LessonWithProgress, index: number) => {
    const isCurrentLesson = lessonItem.id === selectedLessonId;
    const activitiesCompleted =
      lessonItem.activities?.some(
        (a) => a.isCompleted || (a.userProgress ?? 0) > 0
      ) ?? false;

    const hasSeenOrInteracted =
      (isCurrentLesson ? progress > 0 : lessonItem.porcentajecompletado > 0) ||
      activitiesCompleted;

    const shouldShowNew =
      lessonItem.isLocked === false && lessonItem.isNew && !hasSeenOrInteracted;

    // Calcular si está completada
    const isCompleted = isLessonCompleted(lessonItem);

    // Renderizar ícono de estado
    const renderStatusIcon = () => {
      if (lessonItem.isLocked) {
        return (
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 bg-[#01152d] transition-colors" />
        );
      }
      if (isCompleted) {
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-accent"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        );
      }
      return (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 transition-colors group-hover/lesson:border-muted-foreground/50" />
      );
    };

    return (
      <button
        type="button"
        key={lessonItem.id}
        onClick={() => handleClick(lessonItem)}
        className={`group/lesson relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
          isNavigating ? 'cursor-not-allowed opacity-70' : ''
        } ${
          isCurrentLesson ? 'bg-accent/10' : ''
        } ${lessonItem.isLocked ? 'opacity-60' : ''}`}
        onMouseEnter={(e) => {
          if (!isCurrentLesson && !lessonItem.isLocked) {
            e.currentTarget.style.backgroundColor = '#1a2333';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCurrentLesson && !lessonItem.isLocked) {
            e.currentTarget.style.backgroundColor = '';
          }
        }}
        disabled={isNavigating || lessonItem.isLocked}
      >
        {/* Indicador lateral activo */}
        {isCurrentLesson && (
          <div className="absolute top-1/2 -left-[18px] h-6 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
        )}

        {/* Ícono de estado */}
        <div className="shrink-0">{renderStatusIcon()}</div>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`truncate text-sm leading-tight transition-colors ${
                isCurrentLesson
                  ? 'font-medium text-accent'
                  : isCompleted
                    ? 'text-muted-foreground'
                    : 'text-foreground group-hover/lesson:text-foreground'
              }`}
            >
              {lessonItem.title}
            </p>
            {shouldShowNew && (
              <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase">
                Nueva
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1">
            {isCompleted ? (
              <FaCheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <FaClock className="h-3 w-3 text-muted-foreground/70" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {isCompleted
                ? 'Completada'
                : lessonItem.duration
                  ? `${lessonItem.duration} min`
                  : 'Clase'}
            </span>
          </div>
        </div>
      </button>
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
      <div>
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

  // calcular progreso dinámico
  const totalLessonsCount = sortedLessons.length;
  const completedCount = sortedLessons.filter((lesson) =>
    isLessonCompleted(lesson)
  ).length;

  const percent =
    totalLessonsCount > 0
      ? Math.round((completedCount / totalLessonsCount) * 100)
      : 0;

  return (
    <div className="flex h-screen flex-col">
      {/* Progress section at top */}
      <div className="bg-[#061c37cc ] sticky top-2 z-10 border-b border-border px-6 pt-1 pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14">
            <svg className="h-14 w-14 -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                strokeWidth="4"
                stroke="#1d283a"
                className="fill-none"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(percent / 100) * 151} 151`}
                className="fill-none stroke-accent transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-foreground">
                {percent}%
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Tu progreso
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {completedCount} de {totalLessonsCount} clases
            </p>
          </div>
        </div>
      </div>

      {/* Lista de lecciones */}
      <div className="flex-1 overflow-y-visible p-3">
        <div className="mb-2">
          <button className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-secondary/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green-600 bg-green-200 transition-colors group-hover:bg-green-300">
              <SiGoogleclassroom className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm leading-tight font-medium text-foreground">
                Clases
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {completedCount}/{totalLessonsCount} completadas
              </p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0 text-muted-foreground"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div className="max-h-[1000px] overflow-hidden opacity-100 transition-all duration-300">
            <div
              className="ml-5 space-y-1 border-l-2 py-2 pl-4"
              style={{ borderColor: '#1a2333' }}
            >
              {sortedLessons.map((lesson, index) => (
                <div key={lesson.id} className="relative">
                  {renderLessonCard(lesson, index)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
