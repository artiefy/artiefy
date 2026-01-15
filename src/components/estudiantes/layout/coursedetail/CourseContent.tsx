'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaLock,
  FaVideo,
} from 'react-icons/fa';
import { IoIosSave } from 'react-icons/io';
import { IoPlayCircleOutline } from 'react-icons/io5';
import { LuSquareArrowOutUpRight, LuVideo } from 'react-icons/lu';
import { MdVideoLibrary } from 'react-icons/md';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '~/components/estudiantes/ui/alert';
import { Button } from '~/components/estudiantes/ui/button';
import { Progress } from '~/components/estudiantes/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/estudiantes/ui/tooltip';
import { cn } from '~/lib/utils';
import { sortLessons } from '~/utils/lessonSorting';

import CourseModalTeams from './CourseModalTeams';

import type { ClassMeeting, Course } from '~/types';

import '~/styles/buttonclass.css';
import '~/styles/buttonneon.css';
import '~/styles/check.css';
import '~/styles/pattenrliveclass.css';

interface CourseContentProps {
  course: Course;
  isEnrolled: boolean;
  isSubscriptionActive: boolean;
  subscriptionEndDate: string | null;
  isSignedIn: boolean;
  classMeetings?: import('~/types').ClassMeeting[]; // <-- Añade classMeetings aquí
  viewMode?: 'live' | 'recorded';
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Mueve la función formatDuration al principio para asegurar su disponibilidad
function _formatDuration(minutes: number): string {
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
function _formatMeetingDateTimeModern(startDate: string, endDate: string) {
  if (!startDate) return '';
  // Ajustar hora restando 5 horas manualmente
  const start = new Date(startDate);
  start.setHours(start.getHours() - 5);
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(end.getHours() - 5);
  const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(
    start
  );
  const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const mesNombre = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(
    start
  );
  const mesNombreCapitalized =
    mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);
  const day = start.getDate();
  const year = start.getFullYear();
  // Hora inicio
  let hour12 = start.getHours() % 12;
  if (hour12 === 0) hour12 = 12;
  const ampm = start.getHours() < 12 ? 'a. m.' : 'p. m.';
  const minStr = String(start.getMinutes()).padStart(2, '0');
  // Hora fin
  let horaFin = '';
  if (end) {
    let hour12_2 = end.getHours() % 12;
    if (hour12_2 === 0) hour12_2 = 12;
    const ampm2 = end.getHours() < 12 ? 'a. m.' : 'p. m.';
    const minStr2 = String(end.getMinutes()).padStart(2, '0');
    horaFin = `${hour12_2}:${minStr2} ${ampm2}`;
  }
  return (
    <>
      {/* En móviles: apilar fecha y hora verticalmente con tamaños más pequeños */}
      <div className="block sm:hidden">
        <span className="block text-sm font-bold text-yellow-400">
          {weekdayCapitalized}, {String(day)} de {mesNombreCapitalized}, {year}
        </span>
        <span className="block text-sm font-bold text-cyan-400">
          {hour12}:{minStr} {ampm}
          {horaFin && ` — ${horaFin}`}
        </span>
      </div>
      {/* En desktop: mantener diseño inline original */}
      <div className="hidden sm:block">
        <span className="text-base font-bold text-yellow-400">
          {weekdayCapitalized}, {String(day)} de {mesNombreCapitalized}, {year}
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
  viewMode = 'live',
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

  // Section visibility: recorded keeps local state (can be toggled),
  // live is derived from the external `viewMode` to avoid setState inside an effect.
  const [showRecordedClasses, setShowRecordedClasses] = useState<boolean>(
    () => viewMode === 'recorded'
  );

  const showLiveClasses = useMemo(
    () => (viewMode === 'recorded' ? false : true),
    [viewMode]
  );

  useEffect(() => {
    setShowRecordedClasses(viewMode === 'recorded');
  }, [viewMode]);

  // Estado local para mantener actualizados los progresos de los videos
  const computeInitialProgress = () => {
    if (!Array.isArray(classMeetings)) return {} as Record<number, number>;
    return classMeetings.reduce(
      (acc, meeting) => {
        if (typeof meeting.progress === 'number')
          acc[meeting.id] = meeting.progress;
        return acc;
      },
      {} as Record<number, number>
    );
  };

  const [meetingsProgress, setMeetingsProgress] = useState<
    Record<number, number>
  >(computeInitialProgress);

  const [hoveredLesson, setHoveredLesson] = useState<number | null>(null);

  // Helper para calcular duración en minutos
  const getDurationMinutes = (meeting: ClassMeeting) =>
    meeting.startDateTime && meeting.endDateTime
      ? Math.round(
          (new Date(meeting.endDateTime).getTime() -
            new Date(meeting.startDateTime).getTime()) /
            60000
        )
      : 5;

  // NUEVO: Formato compacto para móviles (Ej: "Vie, Nov 8") usando Intl y fallback
  const formatMobileDate = (start?: string) => {
    if (!start) return '';
    const d = new Date(start);
    // Ajustar a -5 horas para mostrar en zona deseada
    d.setHours(d.getHours() - 5);
    try {
      const weekday = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
      }).format(d);
      const month = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(
        d
      );
      const day = d.getDate();
      const year = d.getFullYear();
      // Capitalizar primera letra: Martes, 15 de Diciembre, 2025
      const weekdayCapitalized =
        weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
      return `${weekdayCapitalized}, ${day} de ${monthCapitalized}, ${year}`;
    } catch {
      return `${d.getFullYear()}/${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1
      ).padStart(2, '0')}`;
    }
  };

  // Helper para capitalizar abreviaturas (lun -> Lun)
  const _capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // NUEVO: Formato rango horario "12:30 p.m. – 5:30 p.m." en es-CO
  // Prefijado con _ porque actualmente no se usa y ESLint lo reclama.
  const _formatTimeRange = (start?: string, end?: string) => {
    if (!start || !end) return '';
    const s = new Date(start);
    const e = new Date(end);
    const formatPart = (d: Date) => {
      // Intl en es-ES devuelve "12:30" y AM/PM puede variar; manualizar sufijo
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const isPM = hours >= 12;
      const suffix = isPM ? 'p.m.' : 'a.m.';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${suffix}`;
    };
    return `${formatPart(s)} – ${formatPart(e)}`;
  };

  // Nuevo: formatea solo la hora de inicio (ej: "7:00 p.m.")
  const formatStartTime = (start?: string) => {
    if (!start) return '';
    const d = new Date(start);
    // Ajustar a -5 horas para mostrar en zona deseada
    d.setHours(d.getHours() - 5);
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const isPM = d.getHours() >= 12;
    const suffix = isPM ? 'p.m.' : 'a.m.';
    const hours = d.getHours() % 12 || 12;
    return `${hours}:${minutes} ${suffix}`;
  };

  // Nuevo: etiqueta legible para duración con pluralización correcta
  const formatDurationLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes % 60 === 0) {
      const h = minutes / 60;
      return `${h} ${h === 1 ? 'hora' : 'horas'}`;
    }
    // Mostrar horas con un decimal cuando no es entero
    return `${(minutes / 60).toFixed(1)} horas`;
  };

  // NUEVO: Duración en horas redondeada a 1 decimal si no es entera
  // Prefijado con _ porque actualmente no se usa y ESLint lo reclama.
  const _formatDurationHours = (minutes: number) => {
    const hours = minutes / 60;
    if (Number.isInteger(hours)) return `${hours} h`;
    return `${hours.toFixed(1)} h`;
  };

  // Add toggle functions for sections
  // NOTE: live visibility is derived from `viewMode` so there's no local toggle.
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

  // Si la prop classMeetings cambia, sincronizar progresos de forma asíncrona
  useEffect(() => {
    if (!Array.isArray(classMeetings)) return;
    const initialProgress = classMeetings.reduce(
      (acc, meeting) => {
        if (typeof meeting.progress === 'number')
          acc[meeting.id] = meeting.progress;
        return acc;
      },
      {} as Record<number, number>
    );
    const t = setTimeout(() => setMeetingsProgress(initialProgress), 0);
    return () => clearTimeout(t);
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
          className={cn(
            'overflow-hidden text-white transition-colors border rounded-lg',
            isUnlocked ? 'sm:hover:neon-live-class' : 'opacity-75'
          )}
          style={{
            backgroundColor: '#1a233366',
            borderColor: '#1d283a',
          }}
        >
          <button
            className="flex w-full items-center justify-between px-6 py-4"
            onClick={() => toggleLesson(lesson.id)}
            disabled={!isUnlocked}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  {isUnlocked ? (
                    <FaCheckCircle className="mr-2 size-5 text-green-500" />
                  ) : (
                    <FaLock className="mr-2 size-5 text-gray-400" />
                  )}
                  <span className="font-medium text-white">{lesson.title}</span>
                  <span className="text-sm text-gray-300 ml-2">
                    ({lesson.duration} mins)
                  </span>
                </div>
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
            <div
              className="border-t px-6 py-4 bg-[#1a233366] hover:bg-[#01152d] transition-colors"
              style={{
                borderColor: '#1d283a',
              }}
            >
              {(() => {
                const showTooltip =
                  lesson.description && lesson.description.length > 150;
                const descriptionContent = (
                  <p
                    className="mb-4 max-w-full break-words whitespace-pre-wrap text-gray-300 line-clamp-3"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    <IoPlayCircleOutline className="inline mr-2 text-white w-4 h-4 -mt-1" />
                    {lesson.description ??
                      'No hay descripción disponible para esta clase.'}
                  </p>
                );
                return showTooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {descriptionContent}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="whitespace-pre-wrap break-words">
                        {lesson.description ??
                          'No hay descripción disponible para esta clase.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  descriptionContent
                );
              })()}
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: '#1d283a' }}
                >
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${lesson.porcentajecompletado}%` }}
                  />
                </div>
                <span className="text-xs" style={{ color: '#94a3b8' }}>
                  {lesson.porcentajecompletado}%
                </span>
                <a
                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 overflow-hidden"
                  href={`/estudiantes/clases/${lesson.id}`}
                  onClick={handleClick}
                  onMouseEnter={() => setHoveredLesson(lesson.id)}
                  onMouseLeave={() => setHoveredLesson(null)}
                  style={{
                    backgroundColor:
                      hoveredLesson === lesson.id ? '#22c4d3' : '#22c4d31a',
                    color: hoveredLesson === lesson.id ? '#080c16' : '#22c4d3',
                  }}
                >
                  <span className="relative">
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
                      className="lucide lucide-navigation w-4 h-4 -rotate-[25deg] transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-4 group-hover:translate-x-2 group-active:animate-[rocket-launch_0.4s_ease-out]"
                    >
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
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
                      className="lucide lucide-navigation w-4 h-4 -rotate-[25deg] absolute inset-0 opacity-0 translate-y-4 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0"
                    >
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                  </span>
                  Ver Clase
                </a>
              </div>
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
    hoveredLesson,
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

  const _formatDate = (dateString: string | null) => {
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
  const _subscriptionStatusInfo = useMemo(() => {
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

  const lessonsSectionTopMargin =
    upcomingMeetings.length === 0 ? 'mt-2' : 'mt-6';

  const recordedSectionTopMargin =
    upcomingMeetings.length === 0 ? 'mt-2' : 'mt-6';

  // Identificar la próxima clase en vivo (la más cercana en tiempo)
  const nextMeetingId = useMemo(() => {
    if (upcomingMeetings.length === 0) return null;
    return upcomingMeetings[0].id; // La primera clase después de ordenar
  }, [upcomingMeetings]);

  const featuredLiveMeeting = upcomingMeetings[0];

  const featuredLiveDetails =
    featuredLiveMeeting && featuredLiveMeeting.startDateTime
      ? (() => {
          const start = new Date(featuredLiveMeeting.startDateTime!);
          start.setHours(start.getHours() - 5);
          const end = featuredLiveMeeting.endDateTime
            ? new Date(featuredLiveMeeting.endDateTime)
            : null;
          if (end) end.setHours(end.getHours() - 5);

          const month = new Intl.DateTimeFormat('es-ES', {
            month: 'long',
          }).format(start);
          const monthCapitalized =
            month.charAt(0).toUpperCase() + month.slice(1);
          const day = start.getDate();
          const year = start.getFullYear();

          return {
            dateLabel: `${day} de ${monthCapitalized}, ${year}`,
            timeRangeLabel: `${start.toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}${
              end
                ? ` - ${end.toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}`
                : ''
            }`,
            durationLabel: formatDurationLabel(
              getDurationMinutes(featuredLiveMeeting)
            ),
            compactDateLabel:
              formatMobileDate(featuredLiveMeeting.startDateTime) ?? undefined,
          };
        })()
      : null;

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
    <div
      className={cn(
        'relative px-4 sm:px-0',
        viewMode === 'recorded' || upcomingMeetings.length === 0
          ? 'pt-0'
          : 'pt-6'
      )}
    >
      {/* Removed bg-white class from the main container */}

      {isEnrolled && isFullyCompleted && (
        <div className="artiefy-check-container mb-4">
          <h2 className="animate-pulse bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-3xl font-extrabold text-transparent drop-shadow-[0_2px_2px_rgba(0,200,0,0.4)]">
            ¡Curso Completado!
          </h2>
          <div className="artiefy-static-checkmark" />
        </div>
      )}

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
        <>
          {/* Fondo animado SOLO para el bloque interno de bienvenida/no inscrito */}
          {upcomingMeetings.length > 0 && (!isSignedIn || !isEnrolled) ? (
            <div
              className="mb-6 rounded-[12px] border p-4 sm:p-5"
              style={{
                backgroundColor: '#061c3799',
                borderColor: 'hsla(217, 33%, 17%, 0.5)',
              }}
            >
              <div className="flex w-full flex-col items-stretch gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      EN VIVO
                    </span>
                    <span className="text-base font-semibold text-slate-100 sm:text-lg">
                      Clase en vivo
                    </span>
                  </div>
                  {featuredLiveDetails && (
                    <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      Próxima
                    </span>
                  )}
                </div>

                {featuredLiveDetails && (
                  <>
                    <p className="text-xs text-slate-300 sm:text-sm">
                      La primera clase en vivo del curso es el{' '}
                      <span className="font-semibold text-white">
                        {featuredLiveDetails.dateLabel}
                      </span>
                      {featuredLiveDetails.timeRangeLabel && (
                        <>
                          {' '}
                          a las{' '}
                          <span className="font-semibold text-white">
                            {featuredLiveDetails.timeRangeLabel}
                          </span>
                        </>
                      )}
                    </p>
                    <div className="flex flex-col gap-2 text-xs text-slate-300 sm:flex-row sm:items-center sm:text-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1">
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
                          className="h-4 w-4"
                        >
                          <path d="M8 2v4"></path>
                          <path d="M16 2v4"></path>
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="4"
                            rx="2"
                          ></rect>
                          <path d="M3 10h18"></path>
                        </svg>
                        {featuredLiveDetails.compactDateLabel ||
                          featuredLiveDetails.dateLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1">
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
                          className="h-4 w-4"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>
                          {featuredLiveDetails.timeRangeLabel}
                          {featuredLiveDetails.durationLabel && (
                            <span className="ml-1 text-[11px] text-slate-400">
                              ({featuredLiveDetails.durationLabel})
                            </span>
                          )}
                        </span>
                      </span>
                    </div>
                  </>
                )}

                <div className="text-xs text-slate-300 sm:text-sm">
                  {!isSignedIn ? (
                    <>
                      <span className="font-semibold text-white">
                        Inicia sesión
                      </span>{' '}
                      para ver todas las clases disponibles.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-white">
                        Inscríbete al curso
                      </span>{' '}
                      para acceder a todas las clases.
                    </>
                  )}
                </div>

                {!isSignedIn ? (
                  <Link
                    href="/sign-in"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20 sm:w-auto"
                  >
                    <FaLock className="h-4 w-4" />
                    Inicia sesión
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-200">
                    <FaLock className="h-3.5 w-3.5" />
                    Acceso restringido para estudiantes inscritos
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Clases en vivo - Sección con su propio toggle */}
              {upcomingMeetings.length > 0 && viewMode !== 'recorded' && (
                <div className={cn('mb-6')}>
                  {/* Header con variantes responsive */}
                  {/* Mobile: icono videocam + texto centrado */}
                  <div
                    className={`${recordedSectionTopMargin} mb-3 flex flex-col items-center rounded-2xl border sm:hidden`}
                    style={{ backgroundColor: '#01152d' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-full bg-red-500/20 p-2">
                        <LuVideo className="h-5 w-5 text-red-400" />
                      </div>
                      <h2 className="text-lg font-bold text-white">
                        Clases en Vivo
                      </h2>
                    </div>
                  </div>

                  {/* Desktop: icono videocam + texto alineados */}
                  <div className="mb-4 hidden items-center sm:flex">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-full bg-red-500/20 p-2">
                        <LuVideo className="h-5 w-5 text-red-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">
                        Clases en Vivo
                      </h2>
                    </div>
                  </div>

                  {/* Live classes content - responsive: "ver menos" muestra solo la siguiente clase */}
                  <div
                    className={cn(
                      'space-y-4 transition-all duration-300',
                      shouldBlurContent &&
                        'pointer-events-none opacity-100 blur-[2px]'
                    )}
                  >
                    {(() => {
                      // 1) Quitar vencidas
                      const now = new Date();
                      const upcoming = liveMeetings.filter(
                        (meeting: ClassMeeting) => {
                          if (meeting.endDateTime) {
                            const end = new Date(meeting.endDateTime);
                            if (now > end) return false;
                          }
                          return true;
                        }
                      );

                      // 2) Si está en modo "ver menos", dejar solo la próxima clase
                      let list = upcoming;
                      if (!showLiveClasses) {
                        if (typeof nextMeetingId === 'number') {
                          list = upcoming.filter((m) => m.id === nextMeetingId);
                        } else {
                          // fallback por fecha más cercana
                          const sorted = [...upcoming].sort(
                            (a, b) =>
                              new Date(a.startDateTime ?? '').getTime() -
                              new Date(b.startDateTime ?? '').getTime()
                          );
                          list = sorted.length > 0 ? [sorted[0]!] : [];
                        }
                      }

                      // 3) Ocultar clases bloqueadas (no disponibles, no hoy y no próxima)
                      list = list.filter((meeting) => {
                        const isAvailable = isMeetingAvailable(meeting);
                        const isNext =
                          typeof nextMeetingId === 'number' &&
                          meeting.id === nextMeetingId;
                        let isToday = false;
                        if (meeting.startDateTime) {
                          const d = new Date(meeting.startDateTime);
                          isToday =
                            now.getFullYear() === d.getFullYear() &&
                            now.getMonth() === d.getMonth() &&
                            now.getDate() === d.getDate();
                        }
                        return !(!isAvailable && !isNext && !isToday);
                      });

                      return list.map((meeting: ClassMeeting) => {
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

                        // Nota: eliminadas las badges "Hoy" — el estado se muestra vía botón/etiqueta de estado.

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
                          buttonIcon = (
                            <FaClock
                              className="mr-2 inline-block h-4 w-4"
                              style={{ flexShrink: 0 }}
                            />
                          );
                          buttonExtraClass = 'buttonneon';
                        } else if (isToday && isJoinEnabled) {
                          // Botón rojo "Unirse Ahora" con icono de salida
                          buttonBg = 'bg-red-600 text-white hover:bg-red-700';
                          buttonDisabled = false;
                          buttonText = 'Unirse Ahora';
                          buttonIcon = (
                            <LuSquareArrowOutUpRight
                              className="mr-2 inline-block h-4 w-4"
                              style={{ flexShrink: 0 }}
                            />
                          );
                        } else if (
                          isToday &&
                          !isJoinEnabled &&
                          isMeetingEnded
                        ) {
                          buttonBg = 'bg-gray-400 text-white';
                          buttonDisabled = true;
                          buttonText = 'Clase Finalizada';
                          buttonIcon = <FaLock className="mr-2 h-4 w-4" />;
                        } else if (!isAvailable && !isNext && !isToday) {
                          buttonBg = 'bg-[#01142B] text-white';
                          buttonDisabled = true;
                          buttonText = 'Clase Bloqueada';
                          buttonIcon = <FaLock className="mr-2 h-4 w-4" />;
                        }

                        return (
                          <div
                            key={meeting.id}
                            className={cn(
                              'relative flex flex-col gap-3 rounded-[12px] border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4',
                              'sm:hover:neon-live-class'
                            )}
                            style={{
                              backgroundColor: '#061c3799',
                              borderColor: 'hsla(217, 33%, 17%, 0.5)',
                            }}
                          >
                            {/* MOBILE: layout vertical y centrado */}
                            <div className="block w-full sm:hidden">
                              <div className="flex w-full flex-col items-stretch gap-3">
                                {/* Header compacto sin fondo, solo texto y chips */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                                      style={{
                                        backgroundColor: '#061c3799',
                                        color: '#E6F7F8',
                                      }}
                                    >
                                      <span
                                        className="h-1.5 w-1.5 animate-pulse rounded-full"
                                        style={{ backgroundColor: '#061c37' }}
                                      />
                                      EN VIVO
                                    </span>
                                    <h3 className="text-lg leading-snug font-semibold text-slate-100">
                                      {meeting.title}
                                    </h3>
                                  </div>
                                  {isToday && (
                                    <span
                                      className={cn(
                                        'rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold',
                                        isJoinEnabled && !isMeetingEnded
                                          ? 'text-emerald-200'
                                          : 'text-slate-300'
                                      )}
                                    >
                                      {isMeetingEnded
                                        ? 'Finalizada'
                                        : 'Abierta'}
                                    </span>
                                  )}
                                </div>
                                {/* Chips fecha+hora y duracion (móvil) en una sola línea */}
                                <div
                                  className="flex items-center gap-2 text-sm whitespace-nowrap"
                                  style={{ color: '#94a3b8' }}
                                >
                                  <span className="inline-flex items-center gap-1.5">
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
                                      className="h-4 w-4"
                                    >
                                      <path d="M8 2v4"></path>
                                      <path d="M16 2v4"></path>
                                      <rect
                                        width="18"
                                        height="18"
                                        x="3"
                                        y="4"
                                        rx="2"
                                      ></rect>
                                      <path d="M3 10h18"></path>
                                    </svg>
                                    {formatMobileDate(meeting.startDateTime)}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5">
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
                                      className="h-4 w-4"
                                    >
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {formatStartTime(meeting.startDateTime)}{' '}
                                    {(() => {
                                      const dm = getDurationMinutes(meeting);
                                      return `(${formatDurationLabel(dm)})`;
                                    })()}
                                  </span>
                                </div>
                                {/* Botón */}
                                <div className="flex w-full justify-center">
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
                                            {buttonIcon ?? (
                                              <FaVideo className="size-4" />
                                            )}
                                            <span className="relative z-10">
                                              {buttonText}
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
                            {/* DESKTOP: badge + title on one line, date/time/duration below */}
                            <div className="hidden min-w-0 flex-1 flex-col gap-2 sm:flex">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                                  EN VIVO
                                </span>
                                <div className="text-base leading-tight font-semibold text-slate-100">
                                  {meeting.title}
                                </div>
                              </div>
                              <div
                                className="flex items-center gap-2 text-sm whitespace-nowrap"
                                style={{
                                  color: '#94a3b8',
                                  background: '#061c3799',
                                }}
                              >
                                <span className="inline-flex items-center gap-1.5">
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
                                    className="h-4 w-4"
                                  >
                                    <path d="M8 2v4"></path>
                                    <path d="M16 2v4"></path>
                                    <rect
                                      width="18"
                                      height="18"
                                      x="3"
                                      y="4"
                                      rx="2"
                                    ></rect>
                                    <path d="M3 10h18"></path>
                                  </svg>
                                  {formatMobileDate(meeting.startDateTime)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
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
                                    className="h-4 w-4"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  {formatStartTime(meeting.startDateTime)}{' '}
                                  {(() => {
                                    const dm = getDurationMinutes(meeting);
                                    return `(${formatDurationLabel(dm)})`;
                                  })()}
                                </span>
                              </div>
                            </div>
                            {/* Badges desktop removed: 'Hoy' badge disabled per request */}
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
                                        {buttonIcon ?? (
                                          <FaVideo className="size-4" />
                                        )}
                                        <span className="relative z-10">
                                          {buttonText}
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
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Clases Grabadas - Sección visible solo cuando la pestaña grabadas está activa */}
              {recordedMeetings.length > 0 && viewMode === 'recorded' && (
                <div>
                  {/* Header con variantes responsive para grabadas */}
                  <div
                    className="mb-3 flex flex-col items-start rounded-2xl sm:hidden"
                    style={{ backgroundColor: '#01152d' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-full bg-emerald-500/20 p-2">
                        <IoIosSave className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Clases Grabadas
                      </h3>
                    </div>
                  </div>

                  <div
                    className={`${recordedSectionTopMargin} mb-4 hidden items-center justify-between sm:flex`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-full bg-emerald-500/20 p-2">
                        <IoIosSave className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        Clases Grabadas
                      </h3>
                    </div>
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
                        const _durationMinutes = getDurationMinutes(meeting);
                        const currentProgress =
                          meetingsProgress[meeting.id] ?? meeting.progress ?? 0;

                        return (
                          <div
                            key={meeting.id}
                            className={cn(
                              'relative overflow-hidden rounded-[12px] border',
                              'sm:hover:neon-live-class'
                            )}
                            style={{
                              backgroundColor: '#061c37',
                              borderColor: 'hsla(217, 33%, 17%, 0.5)',
                            }}
                          >
                            <button
                              className="flex w-full items-center justify-between px-6 py-4 text-left"
                              onClick={() => toggleRecorded(meeting.id)}
                            >
                              <div className="flex w-full items-center justify-between">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-200 uppercase"
                                      style={{ letterSpacing: '0.08em' }}
                                    >
                                      Grabada
                                    </span>
                                    <h3 className="text-lg leading-snug font-semibold text-slate-100">
                                      {meeting.title ?? `Clase ${meeting.id}`}
                                    </h3>
                                  </div>
                                  <div
                                    className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:text-sm"
                                    style={{ color: '#94a3b8' }}
                                  >
                                    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1">
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
                                        className="h-4 w-4"
                                        style={{ color: '#94a3b8' }}
                                      >
                                        <path d="M8 2v4"></path>
                                        <path d="M16 2v4"></path>
                                        <rect
                                          width="18"
                                          height="18"
                                          x="3"
                                          y="4"
                                          rx="2"
                                        ></rect>
                                        <path d="M3 10h18"></path>
                                      </svg>
                                      {formatMobileDate(
                                        meeting.startDateTime
                                      ) ||
                                        (meeting.startDateTime
                                          ? new Date(
                                              meeting.startDateTime
                                            ).toLocaleDateString('es-ES', {
                                              weekday: 'short',
                                              month: 'short',
                                              day: 'numeric',
                                            })
                                          : 'Fecha por definir')}
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1">
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
                                        className="h-4 w-4"
                                        style={{ color: '#94a3b8' }}
                                      >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      <span>
                                        {formatDurationLabel(
                                          getDurationMinutes(meeting)
                                        )}
                                      </span>
                                    </span>
                                  </div>
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
        </>
      )}

      {/* Regular lessons - Now with white container */}
      {viewMode !== 'recorded' && (
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: '#061c37',
            borderColor: '#1d283a',
          }}
        >
          <h2
            className={`${lessonsSectionTopMargin} mb-4 flex items-center justify-between text-xl font-bold text-white`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-full border border-transparent bg-blue-500/20 p-2 text-blue-300">
                <MdVideoLibrary className="h-4 w-4" />
              </span>
              Clases del Curso
            </div>
            <span className="text-sm font-light text-[#94a3b8]">
              {course.lessons?.length || 0} Clases
            </span>
          </h2>
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
      )}

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
