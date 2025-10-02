'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { PencilRuler } from 'lucide-react';
import {
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaLock,
  FaTimes,
  FaVideo, // Para el icono del botón grabado
} from 'react-icons/fa';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '~/components/estudiantes/ui/alert';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import { Progress } from '~/components/estudiantes/ui/progress';
import { cn } from '~/lib/utils';
import { sortLessons } from '~/utils/lessonSorting';

import CourseModalTeams from './CourseModalTeams';

import type { ClassMeeting, Course } from '~/types';

import '~/styles/buttonclass.css';
import '~/styles/check.css';
import '~/styles/pattenrliveclass.css';
import '~/styles/buttonneon.css';

interface CourseContentProps {
  course: Course;
  isEnrolled: boolean;
  isSubscriptionActive: boolean;
  subscriptionEndDate: string | null;
  isSignedIn: boolean;
  classMeetings?: import('~/types').ClassMeeting[]; // <-- Añade classMeetings aquí
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Mueve la función formatDuration al principio para asegurar su disponibilidad
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours} h`;
  } else {
    return `${hours} h ${mins} min`;
  }
}

// Nuevo formateador para el estilo solicitado
function formatMeetingDateTimeModern(startDate: string, endDate: string) {
  if (!startDate) return '';
  const matchStart =
    /^([0-9]{4})-([0-9]{2})-([0-9]{2})[T\s]([0-9]{2}):([0-9]{2})/.exec(
      startDate
    );
  const matchEnd = endDate
    ? /^([0-9]{4})-([0-9]{2})-([0-9]{2})[T\s]([0-9]{2}):([0-9]{2})/.exec(
        endDate
      )
    : null;
  if (!matchStart) return startDate;
  const [, , month, day, hour, minute] = matchStart;
  const meses = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sept',
    'Oct',
    'Nov',
    'Dic',
  ];
  const mesNombre = meses[parseInt(month, 10) - 1];
  // Hora inicio
  const h = parseInt(hour, 10);
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  const ampm = h < 12 ? 'a. m.' : 'p. m.';
  const minStr = minute.padStart(2, '0');
  // Hora fin
  let horaFin = '';
  if (matchEnd) {
    const h2 = parseInt(matchEnd[4], 10);
    let hour12_2 = h2 % 12;
    if (hour12_2 === 0) hour12_2 = 12;
    const ampm2 = h2 < 12 ? 'a. m.' : 'p. m.';
    const minStr2 = matchEnd[5].padStart(2, '0');
    horaFin = `${hour12_2}:${minStr2} ${ampm2}`;
  }
  return (
    <>
      {/* En móviles: apilar fecha y hora verticalmente con tamaños más pequeños */}
      <div className="block sm:hidden">
        <span className="block text-sm font-bold text-yellow-400">
          {mesNombre} {parseInt(day, 10)},
        </span>
        <span className="block text-sm font-bold text-cyan-400">
          {hour12}:{minStr} {ampm}
          {horaFin && ` — ${horaFin}`}
        </span>
      </div>
      {/* En desktop: mantener diseño inline original */}
      <div className="hidden sm:block">
        <span className="text-base font-bold text-yellow-400">
          {mesNombre} {parseInt(day, 10)},
        </span>{' '}
        <span className="text-base font-bold text-cyan-400">
          {hour12}:{minStr} {ampm}
        </span>
        {horaFin && (
          <>
            <span className="text-base font-bold text-cyan-400">
              {' '}
              — {horaFin}
            </span>
          </>
        )}
      </div>
    </>
  );
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  duration: number;
  orderIndex?: number;
  isLocked?: boolean;
  isNew?: boolean;
  porcentajecompletado?: number;
  // ...otros campos necesarios...
}

export function CourseContent({
  course,
  isEnrolled,
  isSubscriptionActive,
  subscriptionEndDate,
  isSignedIn,
  classMeetings = [],
}: CourseContentProps) {
  // --- Clases grabadas y en vivo ---
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [expandedRecorded, setExpandedRecorded] = useState<number | null>(null);
  const [openRecordedModal, setOpenRecordedModal] = useState(false);
  const [currentRecordedVideo, setCurrentRecordedVideo] = useState<{
    title: string;
    videoKey: string;
    progress?: number;
    meetingId?: number; // <-- Añadido para el ID de la reunión
  } | null>(null);
  const router = useRouter();
  const { user } = useUser();

  // New state variables to track section visibility
  const [showLiveClasses, setShowLiveClasses] = useState(true);
  const [showRecordedClasses, setShowRecordedClasses] = useState(true);

  // Estado local para mantener actualizados los progresos de los videos
  const [meetingsProgress, setMeetingsProgress] = useState<
    Record<number, number>
  >({});

  // Helper para calcular duración en minutos
  const getDurationMinutes = (meeting: ClassMeeting) =>
    meeting.startDateTime && meeting.endDateTime
      ? Math.round(
          (new Date(meeting.endDateTime).getTime() -
            new Date(meeting.startDateTime).getTime()) /
            60000
        )
      : 5;

  // Add toggle functions for sections
  const toggleLiveClasses = useCallback(() => {
    setShowLiveClasses((prev) => !prev);
  }, []);

  const toggleRecordedClasses = useCallback(() => {
    setShowRecordedClasses((prev) => !prev);
  }, []);

  const toggleLesson = useCallback(
    (lessonId: number) => {
      if (isEnrolled) {
        setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
      }
    },
    [expandedLesson, isEnrolled]
  );

  const toggleRecorded = useCallback(
    (meetingId: number) => {
      setExpandedRecorded(expandedRecorded === meetingId ? null : meetingId);
    },
    [expandedRecorded]
  );

  // Inicializar el estado con los progresos existentes
  useEffect(() => {
    if (Array.isArray(classMeetings)) {
      const initialProgress = classMeetings.reduce(
        (acc, meeting) => {
          if (typeof meeting.progress === 'number') {
            acc[meeting.id] = meeting.progress;
          }
          return acc;
        },
        {} as Record<number, number>
      );

      setMeetingsProgress(initialProgress);
    }
  }, [classMeetings]);

  const handleOpenRecordedModal = (meeting: ClassMeeting) => {
    if (meeting.video_key) {
      // Usa el progreso del estado local o el de la BD como respaldo
      const currentProgress =
        meetingsProgress[meeting.id] ?? meeting.progress ?? 0;

      setCurrentRecordedVideo({
        title: meeting.title,
        videoKey: meeting.video_key,
        progress: currentProgress,
        meetingId: meeting.id,
      });
      setOpenRecordedModal(true);
    }
  };

  const handleCloseRecordedModal = () => {
    setOpenRecordedModal(false);
    setCurrentRecordedVideo(null);
  };

  // Nueva función para actualizar el progreso localmente
  const handleVideoProgressUpdate = (meetingId: number, progress: number) => {
    setMeetingsProgress((prev) => ({
      ...prev,
      [meetingId]: progress,
    }));
  };

  const memoizedLessons = useMemo(() => {
    // sortLessons usa orderIndex, así que el orden será correcto
    return sortLessons(course.lessons as Lesson[]).map((lesson) => {
      const isUnlocked =
        isEnrolled &&
        (course.courseType?.requiredSubscriptionLevel === 'none' ||
          isSubscriptionActive) &&
        !lesson.isLocked;

      const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        router.push(`/estudiantes/clases/${lesson.id}`);
      };

      return (
        <div
          key={lesson.id}
          className={`overflow-hidden rounded-lg border-0 transition-colors ${
            isUnlocked
              ? 'bg-gray-800 hover:bg-gray-700'
              : 'bg-gray-800 opacity-75'
          } text-white`}
        >
          <button
            className="flex w-full items-center justify-between px-6 py-4"
            onClick={() => toggleLesson(lesson.id)}
            disabled={!isUnlocked}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center space-x-2">
                {isUnlocked ? (
                  <FaCheckCircle className="mr-2 size-5 text-green-500" />
                ) : (
                  <FaLock className="mr-2 size-5 text-gray-400" />
                )}
                <span className="font-medium text-white">
                  {lesson.title}{' '}
                  <span className="ml-2 text-sm text-gray-300">
                    ({lesson.duration} mins)
                  </span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {isUnlocked &&
                  lesson.isNew &&
                  lesson.porcentajecompletado === 0 && (
                    <span className="ml-2 rounded bg-green-500 px-2 py-1 text-xs text-white">
                      Nuevo
                    </span>
                  )}
                {isUnlocked &&
                  (expandedLesson === lesson.id ? (
                    <FaChevronUp className="text-gray-400" />
                  ) : (
                    <FaChevronDown className="text-gray-400" />
                  ))}
              </div>
            </div>
          </button>
          {expandedLesson === lesson.id && isUnlocked && (
            <div className="border-t border-gray-700 bg-gray-900 px-6 py-4">
              <p className="mb-4 text-gray-300">
                {lesson.description ??
                  'No hay descripción disponible para esta clase.'}
              </p>
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">
                    Progreso De La Clase:
                  </p>
                </div>
                <Progress
                  value={lesson.porcentajecompletado}
                  showPercentage={true}
                  className="transition-none"
                />
              </div>
              <Link
                href={`/estudiantes/clases/${lesson.id}`}
                onClick={handleClick}
              >
                <button className="buttonclass text-black transition-none active:scale-95">
                  <div className="outline" />
                  <div className="state state--default">
                    <div className="icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        height="1.2em"
                        width="1.2em"
                      >
                        <g style={{ filter: 'url(#shadow)' }}>
                          <path
                            fill="currentColor"
                            d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                          />
                          <path
                            fill="currentColor"
                            d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                          />
                        </g>
                        <defs>
                          <filter id="shadow">
                            <feDropShadow
                              floodOpacity="0.6"
                              stdDeviation="0.8"
                              dy="1"
                              dx="0"
                            />
                          </filter>
                        </defs>
                      </svg>
                    </div>
                    <p>
                      <span style={{ '--i': 0 } as React.CSSProperties}>V</span>
                      <span style={{ '--i': 1 } as React.CSSProperties}>e</span>
                      <span style={{ '--i': 2 } as React.CSSProperties}>r</span>
                      <span style={{ '--i': 3 } as React.CSSProperties}> </span>
                      <span style={{ '--i': 4 } as React.CSSProperties}>C</span>
                      <span style={{ '--i': 5 } as React.CSSProperties}>l</span>
                      <span style={{ '--i': 6 } as React.CSSProperties}>a</span>
                      <span style={{ '--i': 7 } as React.CSSProperties}>s</span>
                      <span style={{ '--i': 8 } as React.CSSProperties}>e</span>
                    </p>
                  </div>
                  <div className="state state--sent">
                    <div className="icon">
                      <svg
                        stroke="black"
                        strokeWidth="0.5px"
                        width="1.2em"
                        height="1.2em"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g style={{ filter: 'url(#shadow)' }}>
                          <path
                            d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
                            fill="currentColor"
                          />
                          <path
                            d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
                            fill="currentColor"
                          />
                        </g>
                      </svg>
                    </div>
                    <p>
                      <span style={{ '--i': 5 } as React.CSSProperties}>V</span>
                      <span style={{ '--i': 6 } as React.CSSProperties}>i</span>
                      <span style={{ '--i': 7 } as React.CSSProperties}>s</span>
                      <span style={{ '--i': 8 } as React.CSSProperties}>t</span>
                      <span style={{ '--i': 9 } as React.CSSProperties}>o</span>
                      <span style={{ '--i': 10 } as React.CSSProperties}>
                        !
                      </span>
                    </p>
                  </div>
                </button>
              </Link>
            </div>
          )}
        </div>
      );
    });
  }, [
    course.lessons,
    expandedLesson,
    isEnrolled,
    isSubscriptionActive,
    router,
    toggleLesson,
    course.courseType?.requiredSubscriptionLevel,
  ]);

  const isFullyCompleted = useMemo(() => {
    return course.lessons?.every(
      (lesson) => lesson.porcentajecompletado === 100
    );
  }, [course.lessons]);

  const handleSubscriptionRedirect = useCallback(() => {
    window.open('/planes', '_blank', 'noopener,noreferrer');
  }, []);

  const shouldShowSubscriptionAlert = useMemo(() => {
    return (
      isEnrolled &&
      !isSubscriptionActive &&
      course.courseType?.requiredSubscriptionLevel !== 'none'
    );
  }, [
    isEnrolled,
    isSubscriptionActive,
    course.courseType?.requiredSubscriptionLevel,
  ]);

  const shouldBlurContent = useMemo(() => {
    const isPremiumOrPro =
      course.courseType?.requiredSubscriptionLevel !== 'none';
    return isEnrolled && !isSubscriptionActive && isPremiumOrPro;
  }, [
    isEnrolled,
    isSubscriptionActive,
    course.courseType?.requiredSubscriptionLevel,
  ]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    // Array of month names in Spanish
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} de ${month} de ${year}`;
  };

  // Helper to parse ISO, yyyy/dd/MM, yyyy-dd-MM, yyyy-dd-MM HH:mm:ss
  const parseSubscriptionDate = (dateString: string | null): Date | null => {
    if (!dateString) return null;
    // Try ISO first
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) return isoDate;
    // yyyy/dd/MM
    const matchSlash = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(dateString);
    if (matchSlash) {
      const [, year, day, month] = matchSlash;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    // yyyy-dd-MM or yyyy-dd-MM HH:mm:ss
    const matchDash = /^(\d{4})-(\d{2})-(\d{2})(?:\s+\d{2}:\d{2}:\d{2})?$/.exec(
      dateString
    );
    if (matchDash) {
      const [, year, day, month] = matchDash;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
    // yyyy-MM-dd or yyyy-MM-dd HH:mm:ss
    const matchDash2 =
      /^(\d{4})-(\d{2})-(\d{2})(?:T|\s)?(\d{2})?:?(\d{2})?:?(\d{2})?/.exec(
        dateString
      );
    if (matchDash2) {
      const [, year, month, day, hour = '0', min = '0', sec = '0'] = matchDash2;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(min),
        Number(sec)
      );
    }
    return null;
  };

  // Determina si la suscripción está activa según los metadatos
  const subscriptionStatusInfo = useMemo(() => {
    if (!isSignedIn) return null;

    // Check subscription status from metadata first
    const subscriptionStatus = user?.publicMetadata?.subscriptionStatus as
      | string
      | undefined;
    const isStatusInactive = subscriptionStatus === 'inactive';

    // Then check end date
    if (!subscriptionEndDate)
      return isStatusInactive ? { active: false, endDate: null } : null;

    const endDate = parseSubscriptionDate(subscriptionEndDate);
    if (!endDate)
      return isStatusInactive ? { active: false, endDate: null } : null;

    const now = new Date();
    const isDateExpired = endDate <= now;

    // Either inactive status OR expired date makes subscription inactive
    return {
      active: !isStatusInactive && !isDateExpired,
      endDate,
    };
  }, [
    isSignedIn,
    subscriptionEndDate,
    user?.publicMetadata?.subscriptionStatus,
  ]);

  // Use this for subscription active logic
  const isSubscriptionReallyActive = useMemo(() => {
    if (!isEnrolled) return false;
    if (!subscriptionEndDate) return isSubscriptionActive;
    const endDate = parseSubscriptionDate(subscriptionEndDate);
    if (!endDate) return false;
    return endDate > new Date();
  }, [isEnrolled, isSubscriptionActive, subscriptionEndDate]);

  // --- Clases grabadas y en vivo ---
  // Filter classMeetings into upcoming and recorded, and sort upcoming by date
  const upcomingMeetings: ClassMeeting[] = useMemo(() => {
    const now = new Date();
    return Array.isArray(classMeetings)
      ? classMeetings
          .filter(
            (meeting) =>
              meeting.startDateTime &&
              new Date(meeting.startDateTime) > now &&
              !meeting.video_key
          )
          .sort((a, b) => {
            if (!a.startDateTime || !b.startDateTime) return 0;
            return (
              new Date(a.startDateTime).getTime() -
              new Date(b.startDateTime).getTime()
            );
          })
      : [];
  }, [classMeetings]);

  const recordedMeetings: ClassMeeting[] = useMemo(() => {
    return Array.isArray(classMeetings)
      ? classMeetings.filter((meeting) => !!meeting.video_key)
      : [];
  }, [classMeetings]);

  // Agrega liveMeetings para mostrar todas las clases en vivo (pasadas y futuras, sin video_key)
  const liveMeetings: ClassMeeting[] = useMemo(() => {
    return Array.isArray(classMeetings)
      ? classMeetings
          .filter((meeting) => !meeting.video_key)
          .sort((a, b) => {
            if (!a.startDateTime || !b.startDateTime) return 0;
            return (
              new Date(a.startDateTime).getTime() -
              new Date(b.startDateTime).getTime()
            );
          })
      : [];
  }, [classMeetings]);

  // Identificar la próxima clase en vivo (la más cercana en tiempo)
  const nextMeetingId = useMemo(() => {
    if (upcomingMeetings.length === 0) return null;
    return upcomingMeetings[0].id; // La primera clase después de ordenar
  }, [upcomingMeetings]);

  // Add this helper function to check if a meeting is scheduled for today or is next
  const isMeetingAvailable = useCallback(
    (meeting: ClassMeeting): boolean => {
      if (!meeting.startDateTime) return false;

      // Si es la próxima clase programada, está disponible
      if (meeting.id === nextMeetingId) return true;

      // Usar directamente los datos de BD sin conversión de zona horaria
      const now = new Date();
      const meetingDate = new Date(meeting.startDateTime);

      // Compare year, month, and day directly
      return (
        now.getFullYear() === meetingDate.getFullYear() &&
        now.getMonth() === meetingDate.getMonth() &&
        now.getDate() === meetingDate.getDate()
      );
    },
    [nextMeetingId]
  );

  return (
    <div className="relative px-6 pt-6">
      {/* Removed bg-white class from the main container */}
      <div className="mb-6">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-primary mt-2 text-2xl font-bold sm:mt-0">
            Contenido Del Curso
          </h2>
          {isSignedIn && subscriptionStatusInfo && (
            <div className="flex flex-col items-end gap-1">
              {subscriptionStatusInfo.active && (
                <div className="mt-0 flex items-center gap-2 text-green-500 sm:mt-6">
                  <FaCheck className="size-4" />
                  <span className="font-medium">Suscripción Activa</span>
                </div>
              )}
              {!subscriptionStatusInfo.active && (
                <div className="mt-0 flex items-center gap-2 text-red-500 sm:mt-6">
                  <FaTimes className="size-4" />
                  <span className="font-medium">Suscripción Inactiva</span>
                </div>
              )}
              {subscriptionStatusInfo.endDate && (
                <p className="text-sm text-red-500">
                  Finaliza: {formatDate(subscriptionEndDate)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {isEnrolled && isFullyCompleted && (
        <div className="artiefy-check-container mb-4">
          <h2 className="animate-pulse bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-3xl font-extrabold text-transparent drop-shadow-[0_2px_2px_rgba(0,200,0,0.4)]">
            ¡Curso Completado!
          </h2>
          <div className="artiefy-static-checkmark" />
        </div>
      )}

      <PencilRuler
        className={`text-primary absolute top-4 right-7 transition-colors ${
          expandedLesson !== null ? 'text-orange-500' : 'text-primary'
        }`}
      />

      {isEnrolled &&
        !isSubscriptionReallyActive &&
        shouldShowSubscriptionAlert && (
          <Alert
            variant="destructive"
            className="mb-6 border-2 border-red-500 bg-red-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <AlertTitle className="mb-2 text-xl font-bold text-red-700">
                  ¡Tu suscripción ha expirado!
                </AlertTitle>
                <AlertDescription className="text-base text-red-600">
                  <p className="mb-4">
                    Para seguir disfrutando de todo el contenido premium y
                    continuar tu aprendizaje, necesitas renovar tu suscripción.
                  </p>
                  <Button
                    onClick={handleSubscriptionRedirect}
                    className="transform rounded-lg bg-red-500 px-6 py-2 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-red-600 active:scale-95"
                  >
                    Renovar Suscripción Ahora
                  </Button>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

      {/* --- Clases en Vivo y Grabadas --- */}
      {(upcomingMeetings.length > 0 || recordedMeetings.length > 0) && (
        <div className="bg-background mb-8 rounded-lg border p-6 shadow-sm">
          {/* Fondo animado SOLO para el bloque interno de bienvenida/no inscrito */}
          {!isSignedIn || !isEnrolled ? (
            <div
              className="border-secondary overflow-hidden rounded-2xl border p-0 text-center shadow-lg"
              style={{ background: '#1e2939', position: 'relative' }}
            >
              <div className="pattenrs" style={{ zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="flex flex-col items-center gap-2 px-8 pt-8 pb-4 sm:px-8 sm:pt-8 sm:pb-4">
                  <span className="mb-2 inline-block rounded-full border border-cyan-300 bg-cyan-200 px-4 py-1 text-xs font-semibold text-cyan-800 shadow-sm sm:text-sm">
                    <FaVideo className="mr-2 inline-block text-cyan-600" />
                    Clase en Vivo
                  </span>
                  {/* Responsive: frase y fecha en líneas separadas solo en móvil, en desktop como antes */}
                  <h3
                    className="relative mb-2 text-xs leading-tight font-extrabold drop-shadow-sm sm:text-2xl"
                    style={{
                      color: '#fff',
                      zIndex: 2,
                      wordBreak: 'break-word',
                    }}
                  >
                    {upcomingMeetings.length > 0 ? (
                      <>
                        {/* Móvil: frase y fecha en líneas separadas, letra pequeña */}
                        <span className="block text-xs sm:hidden">
                          La primera clase en vivo del curso es el
                        </span>
                        <span
                          className="mt-1 block text-xs font-extrabold underline underline-offset-2 sm:hidden"
                          style={{
                            color: '#00BDD8', // secondary
                          }}
                        >
                          {new Date(
                            upcomingMeetings[0].startDateTime
                          ).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        {upcomingMeetings[0].startDateTime && (
                          <span className="mt-1 block sm:hidden">
                            <span
                              className="inline-block rounded-full border border-cyan-300 bg-cyan-200 px-3 py-0.5 text-[11px] font-bold"
                              style={{
                                color: '#006b7a',
                                textDecoration: 'none',
                              }}
                            >
                              {new Date(
                                upcomingMeetings[0].startDateTime
                              ).toLocaleTimeString('es-CO', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}{' '}
                              -{' '}
                              {upcomingMeetings[0].endDateTime
                                ? new Date(
                                    upcomingMeetings[0].endDateTime
                                  ).toLocaleTimeString('es-CO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  })
                                : ''}
                            </span>
                          </span>
                        )}
                        {/* Desktop: frase y fecha como antes, en una sola línea */}
                        <span className="hidden sm:inline">
                          La primera clase en vivo del curso es el{' '}
                          <span
                            className="font-extrabold underline underline-offset-2"
                            style={{ color: '#00BDD8' }}
                          >
                            {new Date(
                              upcomingMeetings[0].startDateTime
                            ).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          {upcomingMeetings[0].startDateTime && (
                            <>
                              {' '}
                              <span
                                className="ml-1 inline-block rounded border border-cyan-300 bg-cyan-200 px-1.5 py-0.5 text-base font-bold"
                                style={{
                                  color: '#006b7a',
                                  textDecoration: 'none',
                                }}
                              >
                                {new Date(
                                  upcomingMeetings[0].startDateTime
                                ).toLocaleTimeString('es-CO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}{' '}
                                -{' '}
                                {upcomingMeetings[0].endDateTime
                                  ? new Date(
                                      upcomingMeetings[0].endDateTime
                                    ).toLocaleTimeString('es-CO', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true,
                                    })
                                  : ''}
                              </span>
                            </>
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="block text-xs sm:text-base">
                        Próximamente clases en vivo
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex flex-col items-center gap-2 px-4 pb-6 sm:px-8 sm:pb-8">
                  <p
                    className="text-xs font-medium sm:text-lg"
                    style={{ color: '#fff' }}
                  >
                    {!isSignedIn ? (
                      <>
                        <Link
                          href="/sign-in"
                          className="mb-1 inline-block rounded border border-yellow-300 bg-[#00BDD8] px-2 py-1 text-xs font-semibold underline underline-offset-2 hover:bg-[#0097a7] hover:[text-decoration-line:underline] sm:text-base"
                          style={{
                            backgroundColor: '#00BDD8',
                            borderColor: '#0097a7',
                            color: '#006b7a', // secondary más oscuro
                            textDecorationLine: 'none',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          <FaLock
                            className="mr-1 inline-block"
                            style={{ color: '#006b7a' }}
                          />
                          Inicia sesión
                        </Link>
                        <br />
                        <span style={{ color: '#fff' }}>
                          para ver todas las clases disponibles
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mb-1 inline-block rounded border border-yellow-300 bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700 sm:text-base">
                          <FaLock className="mr-1 inline-block" />
                          Inscríbete al curso
                        </span>
                        <br />
                        para acceder a todas las clases
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Clases en vivo - Sección con su propio toggle */}
              {upcomingMeetings.length > 0 && (
                <div className={cn('mb-6')}>
                  {/* Header with toggle button for live classes */}
                  <div className="mb-4 flex items-center justify-between">
                    {/* Título único, eliminar doble título */}
                    <h2 className="text-xl font-bold text-white">
                      Clases en Vivo
                    </h2>
                    <button
                      onClick={toggleLiveClasses}
                      className="border-secondary/30 from-secondary/10 to-secondary/5 hover:border-secondary hover:ring-secondary/30 flex items-center gap-2 rounded-full border bg-gradient-to-r px-3 py-1.5 text-sm font-semibold text-black shadow-sm transition-all duration-300 hover:shadow-md hover:ring-1"
                    >
                      <span className="tracking-wide text-white">
                        {showLiveClasses ? 'Ver menos' : 'Ver más'}
                      </span>
                      {showLiveClasses ? (
                        <FaChevronUp className="text-white transition-transform duration-200" />
                      ) : (
                        <FaChevronDown className="text-white transition-transform duration-200" />
                      )}
                    </button>
                  </div>

                  {/* Live classes content - only this gets hidden */}
                  <div
                    className={cn(
                      'space-y-4 transition-all duration-300',
                      shouldBlurContent &&
                        'pointer-events-none opacity-100 blur-[2px]',
                      !showLiveClasses && 'hidden'
                    )}
                  >
                    {/* Filtrar clases en vivo para ocultar las vencidas */}
                    {liveMeetings
                      .filter((meeting: ClassMeeting) => {
                        // Ocultar cualquier clase cuya hora de fin ya pasó (vencida)
                        if (meeting.endDateTime) {
                          const now = new Date();
                          const end = new Date(meeting.endDateTime);
                          if (now > end) return false;
                        }
                        return true;
                      })
                      // Mostrar todas las futuras (se elimina el filtro de solo próxima clase)
                      .map((meeting: ClassMeeting) => {
                        const isAvailable = isMeetingAvailable(meeting);
                        const isNext = meeting.id === nextMeetingId;
                        // Determinar si es hoy usando directamente los datos de BD
                        let isToday = false;
                        let isJoinEnabled = false;
                        let isMeetingEnded = false;
                        if (meeting.startDateTime && meeting.endDateTime) {
                          const now = new Date();
                          const start = new Date(meeting.startDateTime);
                          const end = new Date(meeting.endDateTime);

                          isToday =
                            now.getFullYear() === start.getFullYear() &&
                            now.getMonth() === start.getMonth() &&
                            now.getDate() === start.getDate();
                          isMeetingEnded = now > end;
                          // Permitir unirse todo el día, solo deshabilitar si ya terminó
                          isJoinEnabled = isToday && !isMeetingEnded;
                        }

                        // Badge: Hoy (verde SOLO si botón es "Unirse a la Clase"), gris si "Clase Finalizada"
                        const badgeHoyClass =
                          'rounded-full border border-green-500 bg-green-100 px-3 py-1 font-bold text-green-700 shadow-sm sm:ml-auto';
                        const badgeFinalizadaClass =
                          'rounded-full border border-gray-400 bg-gray-200 px-3 py-1 font-bold text-gray-700 shadow-sm sm:ml-auto';

                        // --- Botón: color según estado ---
                        const buttonClass =
                          'inline-flex h-8 w-[180px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-all border-0';
                        let buttonBg = '';
                        let buttonDisabled = false;
                        let buttonText = '';
                        let buttonIcon = null;
                        let buttonExtraClass = '';

                        if (isNext && !isJoinEnabled) {
                          // Cambia el color a azul aguamarina y fuerza el texto en una sola línea
                          buttonBg = 'buttonneon-aqua';
                          buttonDisabled = true;
                          buttonText = 'Próxima Clase';
                          buttonIcon = <FaLock className="size-4" />;
                          buttonExtraClass = 'buttonneon';
                        } else if (isToday && isJoinEnabled) {
                          buttonBg =
                            'bg-green-600 text-white hover:bg-green-700';
                          buttonDisabled = false;
                          buttonText = 'Unirse a la Clase';
                          buttonIcon = <FaVideo className="size-4" />;
                        } else if (
                          isToday &&
                          !isJoinEnabled &&
                          isMeetingEnded
                        ) {
                          buttonBg = 'bg-gray-400 text-white';
                          buttonDisabled = true;
                          buttonText = 'Clase Finalizada';
                          buttonIcon = <FaLock className="size-4" />;
                        } else if (!isAvailable && !isNext && !isToday) {
                          buttonBg = 'bg-[#01142B] text-white';
                          buttonDisabled = true;
                          buttonText = 'Clase Bloqueada';
                          buttonIcon = <FaLock className="size-4" />;
                        }

                        return (
                          <div
                            key={meeting.id}
                            className={cn(
                              'relative flex flex-col rounded-lg border-0 p-4 shadow sm:flex-row sm:items-center',
                              'bg-gray-800',
                              'hover:neon-live-class'
                            )}
                          >
                            {/* MOBILE: layout vertical y centrado */}
                            <div className="block w-full sm:hidden">
                              <div className="flex w-full flex-col items-center gap-2">
                                {/* Título */}
                                <div className="mb-1 w-full text-center text-base font-bold text-white">
                                  {meeting.title}
                                </div>
                                {/* Fecha y hora */}
                                <div className="mb-1 flex w-full flex-col items-center gap-1">
                                  {formatMeetingDateTimeModern(
                                    meeting.startDateTime,
                                    meeting.endDateTime
                                  )}
                                </div>
                                {/* Duración */}
                                <div className="mb-2 w-full text-center text-sm font-bold text-green-400">
                                  • Duración:{' '}
                                  {formatDuration(getDurationMinutes(meeting))}
                                </div>
                                {/* Badges */}
                                <div className="mb-2 flex w-full flex-row items-center justify-center gap-2">
                                  {isToday && isJoinEnabled && (
                                    <Badge
                                      variant="secondary"
                                      className={badgeHoyClass}
                                    >
                                      Hoy
                                    </Badge>
                                  )}
                                  {isToday &&
                                    !isJoinEnabled &&
                                    isMeetingEnded && (
                                      <Badge
                                        variant="secondary"
                                        className={badgeFinalizadaClass}
                                      >
                                        Hoy
                                      </Badge>
                                    )}
                                </div>
                                {/* Botón centrado */}
                                <div className="mt-2 flex w-full justify-center">
                                  {meeting.joinUrl && (
                                    <>
                                      {isNext && !isJoinEnabled && (
                                        <button
                                          type="button"
                                          className={`${buttonClass} ${buttonExtraClass} ${buttonBg}`}
                                          disabled={buttonDisabled}
                                          style={{
                                            fontFamily:
                                              'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {buttonIcon}
                                          <span className="relative z-10">
                                            {buttonText}
                                          </span>
                                        </button>
                                      )}
                                      {isToday &&
                                        isJoinEnabled &&
                                        meeting.joinUrl && (
                                          <a
                                            href={meeting.joinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${buttonClass} ${buttonBg}`}
                                            tabIndex={
                                              !isSubscriptionActive ? -1 : 0
                                            }
                                            aria-disabled={
                                              !isSubscriptionActive
                                            }
                                            onClick={(e) => {
                                              if (!isSubscriptionActive)
                                                e.preventDefault();
                                            }}
                                            style={{
                                              pointerEvents:
                                                !isSubscriptionActive
                                                  ? 'none'
                                                  : undefined,
                                              opacity: !isSubscriptionActive
                                                ? 0.6
                                                : 1,
                                              fontFamily:
                                                'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                            }}
                                          >
                                            <FaVideo className="size-4" />
                                            <span className="relative z-10">
                                              Unirse a la Clase
                                            </span>
                                          </a>
                                        )}
                                      {isToday &&
                                        !isJoinEnabled &&
                                        isMeetingEnded && (
                                          <button
                                            type="button"
                                            className={`${buttonClass} ${buttonBg}`}
                                            disabled={buttonDisabled}
                                            style={{
                                              fontFamily:
                                                'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                            }}
                                          >
                                            {buttonIcon}
                                            <span className="relative z-10">
                                              {buttonText}
                                            </span>
                                          </button>
                                        )}
                                      {!isAvailable && !isNext && !isToday && (
                                        <button
                                          type="button"
                                          className={`${buttonClass} ${buttonBg}`}
                                          disabled={buttonDisabled}
                                          style={{
                                            fontFamily:
                                              'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                          }}
                                        >
                                          {buttonIcon}
                                          <span className="relative z-10">
                                            {buttonText}
                                          </span>
                                        </button>
                                      )}
                                      {!isSubscriptionActive && (
                                        <div className="mt-2 w-full text-center text-xs font-semibold text-red-600">
                                          Debes tener una suscripción activa
                                          para acceder a las clases en vivo.
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* DESKTOP: layout horizontal como antes */}
                            <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
                              <FaVideo
                                className={cn(
                                  'h-5 w-5 flex-shrink-0 text-cyan-600'
                                )}
                              />
                              <div>
                                <div className="mb-1 text-lg leading-tight font-bold text-white">
                                  {meeting.title}
                                </div>
                                <div className="mb-1 flex items-center gap-2 text-base font-medium">
                                  {formatMeetingDateTimeModern(
                                    meeting.startDateTime,
                                    meeting.endDateTime
                                  )}
                                  <span className="ml-2 text-sm font-bold text-green-400">
                                    • Duración:{' '}
                                    {formatDuration(
                                      getDurationMinutes(meeting)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Badges desktop */}
                            <div className="mt-3 hidden min-w-fit flex-row items-center gap-2 sm:mt-0 sm:ml-4 sm:flex sm:flex-col sm:items-end">
                              {isToday && isJoinEnabled && (
                                <Badge
                                  variant="secondary"
                                  className={badgeHoyClass}
                                >
                                  Hoy
                                </Badge>
                              )}
                              {isToday && !isJoinEnabled && isMeetingEnded && (
                                <Badge
                                  variant="secondary"
                                  className={badgeFinalizadaClass}
                                >
                                  Hoy
                                </Badge>
                              )}
                            </div>
                            {/* Botón desktop */}
                            <div className="mt-3 hidden min-w-fit flex-col sm:mt-0 sm:ml-4 sm:flex">
                              {meeting.joinUrl && (
                                <>
                                  {isNext && !isJoinEnabled && (
                                    <button
                                      type="button"
                                      className={`${buttonClass} ${buttonExtraClass} ${buttonBg}`}
                                      disabled={buttonDisabled}
                                      style={{
                                        fontFamily:
                                          'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {buttonIcon}
                                      <span className="relative z-10">
                                        {buttonText}
                                      </span>
                                    </button>
                                  )}
                                  {isToday &&
                                    isJoinEnabled &&
                                    meeting.joinUrl && (
                                      <a
                                        href={meeting.joinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${buttonClass} ${buttonBg}`}
                                        tabIndex={
                                          !isSubscriptionActive ? -1 : 0
                                        }
                                        aria-disabled={!isSubscriptionActive}
                                        onClick={(e) => {
                                          if (!isSubscriptionActive)
                                            e.preventDefault();
                                        }}
                                        style={{
                                          pointerEvents: !isSubscriptionActive
                                            ? 'none'
                                            : undefined,
                                          opacity: !isSubscriptionActive
                                            ? 0.6
                                            : 1,
                                          fontFamily:
                                            'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                        }}
                                      >
                                        <FaVideo className="size-4" />
                                        <span className="relative z-10">
                                          Unirse a la Clase
                                        </span>
                                      </a>
                                    )}
                                  {isToday &&
                                    !isJoinEnabled &&
                                    isMeetingEnded && (
                                      <button
                                        type="button"
                                        className={`${buttonClass} ${buttonBg}`}
                                        disabled={buttonDisabled}
                                        style={{
                                          fontFamily:
                                            'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                        }}
                                      >
                                        {buttonIcon}
                                        <span className="relative z-10">
                                          {buttonText}
                                        </span>
                                      </button>
                                    )}
                                  {!isAvailable && !isNext && !isToday && (
                                    <button
                                      type="button"
                                      className={`${buttonClass} ${buttonBg}`}
                                      disabled={buttonDisabled}
                                      style={{
                                        fontFamily:
                                          'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                      }}
                                    >
                                      {buttonIcon}
                                      <span className="relative z-10">
                                        {buttonText}
                                      </span>
                                    </button>
                                  )}
                                  {!isSubscriptionActive && (
                                    <div className="mt-2 text-xs font-semibold text-red-600">
                                      Debes tener una suscripción activa para
                                      acceder a las clases en vivo.
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Clases Grabadas - Sección con su propio toggle independiente */}
              {recordedMeetings.length > 0 && (
                <div className="bg-background mb-6 rounded-lg border p-6 shadow-sm">
                  {/* Header with toggle button for recorded classes */}
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      Clases Grabadas
                    </h3>
                    <button
                      onClick={toggleRecordedClasses}
                      className="border-secondary/30 from-secondary/10 to-secondary/5 hover:border-secondary hover:ring-secondary/30 flex items-center gap-2 rounded-full border bg-gradient-to-r px-3 py-1.5 text-sm font-semibold text-black shadow-sm transition-all duration-300 hover:shadow-md hover:ring-1"
                    >
                      <span className="tracking-wide text-white">
                        {showRecordedClasses ? 'Ver menos' : 'Ver más'}
                      </span>
                      {showRecordedClasses ? (
                        <FaChevronUp className="text-white transition-transform duration-200" />
                      ) : (
                        <FaChevronDown className="text-white transition-transform duration-200" />
                      )}
                    </button>
                  </div>

                  {/* Recorded classes content - only this gets hidden */}
                  <div
                    className={cn(
                      'transition-all duration-300',
                      shouldBlurContent &&
                        'pointer-events-none opacity-100 blur-[2px]',
                      !showRecordedClasses && 'hidden' // Hide only recorded classes
                    )}
                  >
                    <div className="space-y-4">
                      {recordedMeetings.map((meeting: ClassMeeting) => {
                        const isExpanded = expandedRecorded === meeting.id;
                        const durationMinutes = getDurationMinutes(meeting);
                        const currentProgress =
                          meetingsProgress[meeting.id] ?? meeting.progress ?? 0;

                        return (
                          <div
                            key={meeting.id}
                            className={`overflow-hidden rounded-lg border-0 bg-gray-800 text-white transition-colors hover:bg-gray-700`}
                          >
                            <button
                              className="flex w-full items-center justify-between px-6 py-4"
                              onClick={() => toggleRecorded(meeting.id)}
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FaCheckCircle className="mr-2 size-5 text-green-500" />
                                  <span className="font-medium text-white">
                                    {meeting.title}{' '}
                                    <span className="ml-2 text-sm text-gray-300">
                                      ({durationMinutes} mins)
                                    </span>
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {isExpanded ? (
                                    <FaChevronUp className="text-gray-400" />
                                  ) : (
                                    <FaChevronDown className="text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="border-t border-gray-700 bg-gray-900 px-6 py-4">
                                <p className="mb-4 text-gray-300">
                                  {
                                    'Clase grabada disponible para repaso y consulta.'
                                  }
                                </p>
                                {/* Barra de progreso de la clase grabada (shadcn) */}
                                <div className="mb-4">
                                  <div className="mb-2 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-300">
                                      Progreso De La Clase Grabada:
                                    </p>
                                    <span className="text-xs text-gray-400">
                                      {currentProgress}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={currentProgress}
                                    showPercentage={true}
                                    className="transition-none"
                                  />
                                </div>
                                {/* Botón para ver clase grabada, deshabilitado si no hay suscripción */}
                                <button
                                  className={cn(
                                    'buttonclass text-black transition-none active:scale-95',
                                    !isSubscriptionActive &&
                                      'pointer-events-none cursor-not-allowed opacity-60'
                                  )}
                                  onClick={() =>
                                    isSubscriptionActive &&
                                    handleOpenRecordedModal(meeting)
                                  }
                                  disabled={!isSubscriptionActive}
                                >
                                  <div className="outline" />
                                  <div className="state state--default">
                                    <div className="icon">
                                      <FaVideo className="text-green-600" />
                                    </div>
                                    <span>Clase Grabada</span>
                                  </div>
                                </button>
                                {!isSubscriptionActive && (
                                  <div className="mt-2 text-xs font-semibold text-red-600">
                                    Debes tener una suscripción activa para ver
                                    la clase grabada.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Regular lessons - Now with white container */}
      <div className="bg-background mb-8 rounded-lg border p-6 shadow-sm">
        {/* Increased padding from p-4 to p-6 */}
        <h2 className="mb-4 text-xl font-bold text-white">Clases del curso</h2>
        <div
          className={cn(
            'transition-all duration-300',
            shouldBlurContent && 'pointer-events-none opacity-100 blur-[2px]',
            !isEnrolled && 'pointer-events-none opacity-100'
          )}
        >
          <div className="space-y-4">{memoizedLessons}</div>
        </div>
      </div>

      {/* MODAL para reproducir clase grabada */}
      {openRecordedModal && currentRecordedVideo && (
        <CourseModalTeams
          open={openRecordedModal}
          title={currentRecordedVideo.title}
          videoKey={currentRecordedVideo.videoKey}
          progress={currentRecordedVideo.progress}
          meetingId={currentRecordedVideo.meetingId}
          onClose={handleCloseRecordedModal}
          onProgressUpdated={handleVideoProgressUpdate} // <-- Pasamos la nueva función
        />
      )}
    </div>
  );
}
