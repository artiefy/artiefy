'use client';

import { useCallback, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { PencilRuler } from 'lucide-react';
import {
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaCrown,
  FaLock,
  FaTimes,
} from 'react-icons/fa';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '~/components/estudiantes/ui/alert';
import { Button } from '~/components/estudiantes/ui/button';
import { Progress } from '~/components/estudiantes/ui/progress';
import { cn } from '~/lib/utils';
import { sortLessons } from '~/utils/lessonSorting';

import type { ClassMeeting, Course } from '~/types';

import '~/styles/buttonclass.css';
import '~/styles/check.css';

interface CourseContentProps {
  course: Course;
  isEnrolled: boolean;
  isSubscriptionActive: boolean;
  subscriptionEndDate: string | null;
  isSignedIn: boolean;
  classMeetings?: ClassMeeting[]; // <-- Cambia any[] por ClassMeeting[]
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function CourseContent({
  course,
  isEnrolled,
  isSubscriptionActive,
  subscriptionEndDate,
  isSignedIn,
  classMeetings = [],
}: CourseContentProps) {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const router = useRouter();
  const { user } = useUser();

  const toggleLesson = useCallback(
    (lessonId: number) => {
      if (isEnrolled) {
        setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
      }
    },
    [expandedLesson, isEnrolled]
  );

  const memoizedLessons = useMemo(() => {
    return sortLessons(course.lessons).map((lesson) => {
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
          className={`overflow-hidden rounded-lg border transition-colors ${
            isUnlocked
              ? 'bg-gray-50 hover:bg-gray-100'
              : 'bg-gray-100 opacity-75'
          }`}
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
                <span className="text-background font-medium">
                  {lesson.title}{' '}
                  <span className="ml-2 text-sm text-gray-500">
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
            <div className="border-t bg-white px-6 py-4">
              <p className="mb-4 text-gray-700">
                {lesson.description ??
                  'No hay descripción disponible para esta clase.'}
              </p>
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
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
                <button className="buttonclass text-background transition-none active:scale-95">
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

  // --- NUEVO: Clases en vivo (Teams) ---
  const upcomingMeetings: ClassMeeting[] = useMemo(() => {
    if (!Array.isArray(classMeetings) || classMeetings.length === 0) return [];
    const now = new Date();
    return classMeetings
      .filter(
        (m): m is ClassMeeting =>
          typeof m.startDateTime === 'string' && new Date(m.startDateTime) > now
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
  }, [classMeetings]);

  // --- NUEVO: Clases grabadas (video_key) ---
  const recordedMeetings: ClassMeeting[] = useMemo(() => {
    if (!Array.isArray(classMeetings) || classMeetings.length === 0) return [];
    return classMeetings
      .filter(
        (m): m is ClassMeeting =>
          typeof m.video_key === 'string' && m.video_key.length > 0
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
  }, [classMeetings]);

  return (
    <div className="relative rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-background mt-2 text-2xl font-bold sm:mt-0">
            Contenido del curso
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

      {/* --- CLASES EN VIVO (TEAMS) --- */}
      {upcomingMeetings.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-bold text-blue-700">
            Clases en Vivo (Teams)
          </h2>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex flex-col rounded-lg border border-blue-300 bg-blue-50 p-4 shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">
                      {meeting.title}
                    </h3>
                    <p className="text-sm text-blue-800">
                      {typeof meeting.startDateTime === 'string'
                        ? new Date(meeting.startDateTime).toLocaleString(
                            'es-CO',
                            {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )
                        : ''}
                      {' - '}
                      {typeof meeting.endDateTime === 'string'
                        ? new Date(meeting.endDateTime).toLocaleString(
                            'es-CO',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )
                        : ''}
                    </p>
                  </div>
                  {meeting.joinUrl && (
                    <a
                      href={meeting.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                    >
                      Unirse a la Clase
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- CLASES GRABADAS --- */}
      {recordedMeetings.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-bold text-green-700">
            Clases Grabadas
          </h2>
          <div className="space-y-3">
            {recordedMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="overflow-hidden rounded-lg border bg-gray-50 transition-colors hover:bg-gray-100"
              >
                <div className="flex w-full items-center justify-between px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">
                      <FaCheckCircle className="mr-2 size-5" />
                    </span>
                    <span className="text-background font-medium">
                      {meeting.title}{' '}
                      <span className="ml-2 text-sm text-gray-500">
                        (
                        {typeof meeting.startDateTime === 'string'
                          ? new Date(meeting.startDateTime).toLocaleDateString(
                              'es-CO'
                            )
                          : ''}
                        )
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/estudiantes/clases/${meeting.id}`}>
                      <button className="buttonclass text-background transition-none active:scale-95">
                        <div className="outline" />
                        <div className="state state--default">
                          <div className="icon">{/* ...SVG icon... */}</div>
                          <p>
                            <span style={{ '--i': 0 } as React.CSSProperties}>
                              V
                            </span>
                            <span style={{ '--i': 1 } as React.CSSProperties}>
                              e
                            </span>
                            <span style={{ '--i': 2 } as React.CSSProperties}>
                              r
                            </span>
                            <span style={{ '--i': 3 } as React.CSSProperties}>
                              {' '}
                            </span>
                            <span style={{ '--i': 4 } as React.CSSProperties}>
                              C
                            </span>
                            <span style={{ '--i': 5 } as React.CSSProperties}>
                              l
                            </span>
                            <span style={{ '--i': 6 } as React.CSSProperties}>
                              a
                            </span>
                            <span style={{ '--i': 7 } as React.CSSProperties}>
                              s
                            </span>
                            <span style={{ '--i': 8 } as React.CSSProperties}>
                              e
                            </span>
                          </p>
                        </div>
                        <div className="state state--sent">
                          <div className="icon">{/* ...SVG icon... */}</div>
                          <p>
                            <span style={{ '--i': 5 } as React.CSSProperties}>
                              V
                            </span>
                            <span style={{ '--i': 6 } as React.CSSProperties}>
                              i
                            </span>
                            <span style={{ '--i': 7 } as React.CSSProperties}>
                              s
                            </span>
                            <span style={{ '--i': 8 } as React.CSSProperties}>
                              t
                            </span>
                            <span style={{ '--i': 9 } as React.CSSProperties}>
                              o
                            </span>
                            <span style={{ '--i': 10 } as React.CSSProperties}>
                              !
                            </span>
                          </p>
                        </div>
                      </button>
                    </Link>
                  </div>
                </div>
                {/* Barra de progreso (si quieres mostrarla, aquí ejemplo fijo al 100%) */}
                <div className="border-t bg-white px-6 py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      Progreso De La Clase:
                    </p>
                  </div>
                  <Progress
                    value={100}
                    showPercentage={true}
                    className="transition-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEnrolled && isFullyCompleted && (
        <div className="artiefy-check-container mb-4">
          <h2 className="animate-pulse bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-3xl font-extrabold text-transparent drop-shadow-[0_2px_2px_rgba(0,200,0,0.4)]">
            ¡Curso Completado!
          </h2>
          <div className="artiefy-static-checkmark" />
        </div>
      )}

      <PencilRuler
        className={`absolute top-4 right-7 transition-colors ${
          expandedLesson !== null ? 'text-orange-500' : 'text-gray-400'
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
              <FaCrown className="size-8 text-red-500" />
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
                    <FaCrown className="mr-2" />
                    Renovar Suscripción Ahora
                  </Button>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

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
  );
}

// No se requieren cambios aquí si el prop course.lessons ya viene sincronizado desde la BD.
