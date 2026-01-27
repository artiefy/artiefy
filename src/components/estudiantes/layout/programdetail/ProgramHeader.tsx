'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid';
import * as Tabs from '@radix-ui/react-tabs';
import { Award, Book, Clock, Crown, Users, Video } from 'lucide-react';
import { FaCheck, FaClock, FaTimes } from 'react-icons/fa';
import { IoCloseOutline } from 'react-icons/io5';
import { LiaCertificateSolid } from 'react-icons/lia';
import { LuSquareArrowOutUpRight, LuVideo } from 'react-icons/lu';
import { toast } from 'sonner';
import useSWR from 'swr';

import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';
import { blurDataURL } from '~/lib/blurDataUrl';
import { type GradesApiResponse } from '~/lib/utils2';
import { getProgramEnrollmentCount } from '~/server/actions/estudiantes/programs/getProgramEnrollmentCount';

import { ProgramCertificationPanel, ProgramContent } from './ProgramContent';
import { ProgramGradesModal } from './ProgramGradesModal';

import type { ClassMeeting, Course, MateriaWithCourse, Program } from '~/types';

import '~/styles/buttonneon.css';
import '~/styles/certificado-modal.css';
import '~/styles/certificadobutton.css';
import '~/styles/certificadobutton2.css';
import '~/styles/pattenrliveclass.css';

interface ProgramHeaderProps {
  program: Program;
  isEnrolled: boolean;
  isEnrolling: boolean;
  isUnenrolling: boolean;
  isSubscriptionActive: boolean;
  subscriptionEndDate: string | null;
  onEnrollAction: () => Promise<void>;
  onUnenrollAction: () => Promise<void>;
  isCheckingEnrollment: boolean;
  courseEnrollments: Record<number, boolean>;
  isLoadingEnrollments: boolean;
}

// Add error type
interface FetchError {
  error?: string;
  message?: string;
}

export function ProgramHeader({
  program,
  isEnrolled,
  isEnrolling,
  isUnenrolling,
  isSubscriptionActive,
  subscriptionEndDate: _subscriptionEndDate,
  onEnrollAction,
  onUnenrollAction,
  isCheckingEnrollment,
  courseEnrollments,
  isLoadingEnrollments,
}: ProgramHeaderProps) {
  const { user, isSignedIn } = useUser();
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isLoadingGrade, setIsLoadingGrade] = useState(true);
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'cursos' | 'en-vivo' | 'certificacion'
  >('cursos');
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [liveSessions, setLiveSessions] = useState<
    (ClassMeeting & { courseTitle: string; courseId: number })[]
  >([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  // Agregar estado para controlar renderizado después de hidratación
  const [isClient, setIsClient] = useState(false);

  // Establecer isClient en true después del primer renderizado (solo en cliente)
  useEffect(() => {
    if (!isClient) setIsClient(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isActive = true;
    const fetchEnrollmentCount = async () => {
      try {
        const count = await getProgramEnrollmentCount(Number(program.id));
        if (isActive) setEnrollmentCount(count);
      } catch (error) {
        console.error('Error al obtener inscritos del programa:', error);
      }
    };

    void fetchEnrollmentCount();

    return () => {
      isActive = false;
    };
  }, [program.id]);

  const courses = useMemo(() => {
    const safeMateriasWithCursos =
      program.materias?.filter(
        (materia): materia is MateriaWithCourse & { curso: Course } =>
          materia.curso !== undefined && 'id' in materia.curso
      ) ?? [];

    const uniqueCourses = safeMateriasWithCursos.reduce(
      (acc, materia) => {
        if (!acc.some((item) => item.curso.id === materia.curso.id)) {
          acc.push(materia);
        }
        return acc;
      },
      [] as (MateriaWithCourse & { curso: Course })[]
    );

    return uniqueCourses.map((materia) => materia.curso);
  }, [program.materias]);

  const totalContentMinutes = useMemo(() => {
    return courses.reduce((acc, course) => {
      const lessons = course.lessons ?? [];
      const courseMinutes = lessons.reduce(
        (sum, lesson) => sum + (lesson.duration ?? 0),
        0
      );
      return acc + courseMinutes;
    }, 0);
  }, [courses]);

  const totalContentLabel = useMemo(() => {
    if (totalContentMinutes <= 0) return '0h';
    const hours = totalContentMinutes / 60;
    if (hours >= 1) {
      return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
    }
    return `${totalContentMinutes} min`;
  }, [totalContentMinutes]);

  const liveSessionsCount = liveSessions.length;

  // Replace useEffect with useSWR
  // Improve error handling with proper types
  const { data: gradesData, error: gradesError } = useSWR<
    GradesApiResponse,
    FetchError
  >(
    user?.id
      ? `/api/grades/program?userId=${user.id}&programId=${program.id}`
      : null,
    async (url: string): Promise<GradesApiResponse> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error fetching grades');
      const data = (await res.json()) as GradesApiResponse;
      return data;
    },
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
    }
  );

  // Agrupa por curso y toma solo una nota final por curso (la primera materia encontrada)
  const allCourses =
    program.materias?.map((m) => m.curso?.title ?? 'Curso sin nombre') ?? [];
  const uniqueCourses = Array.from(new Set(allCourses));

  const coursesGrades: CourseGrade[] = uniqueCourses.map((courseTitle) => {
    // Busca la primera materia de ese curso en gradesData
    const materiaDelCurso = gradesData?.materias?.find(
      (m) => m.courseTitle === courseTitle
    );
    // Toma la nota final de esa materia (todas tienen la misma)
    const finalGrade = materiaDelCurso ? Number(materiaDelCurso.grade) : 0;
    return {
      courseTitle,
      finalGrade,
    };
  });

  // Promedio temporal del programa usando la nota final de cada curso
  const programAverage =
    coursesGrades.length > 0
      ? Number(
          (
            coursesGrades.reduce((a, b) => a + (b.finalGrade ?? 0), 0) /
            coursesGrades.length
          ).toFixed(2)
        )
      : 0;

  // Verificar si el usuario tiene nota para todas las materias del programa
  const programMateriaIds = program.materias?.map((m) => m.id) ?? [];

  // Verificar si todas las materias están aprobadas (nota >= 3)
  const _hasAllMateriasPassed =
    programMateriaIds.length > 0 &&
    programMateriaIds.every((mid) =>
      gradesData?.materias?.some(
        (gm) => Number(gm.id) === Number(mid) && Number(gm.grade) >= 3
      )
    );

  interface CourseGrade {
    courseTitle: string;
    finalGrade: number;
  }

  // Update loading state based on SWR
  // Update loading state with proper error handling
  useEffect(() => {
    const shouldBeLoading = !gradesData && !gradesError;
    setIsLoadingGrade((prev) =>
      prev !== shouldBeLoading ? shouldBeLoading : prev
    );
  }, [gradesData, gradesError]);

  // Verificar plan Premium y fecha de vencimiento
  const isPremium = user?.publicMetadata?.planType === 'Premium';
  const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
    | string
    | null;
  const isSubscriptionValid =
    isPremium &&
    (!subscriptionEndDate || new Date(subscriptionEndDate) > new Date());
  const canEnroll = isSubscriptionActive && isSubscriptionValid;
  const coverImageUrl = program.coverImageKey
    ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
    : 'https://placehold.co/1200x675/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
  const _getCategoryName = (program: Program) => {
    return program.category?.name ?? 'Sin categoría';
  };

  // Constante de zona horaria para formateo de fechas
  const MEETING_TIME_ZONE = 'America/Bogota';

  const toSafeDate = (value?: string | number | Date | null) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };

  const formatBogota = useCallback(
    (
      value: string | number | Date | null | undefined,
      options: Intl.DateTimeFormatOptions,
      locale = 'es-ES'
    ) => {
      const date = toSafeDate(value);
      if (!date) return '';
      return new Intl.DateTimeFormat(locale, {
        timeZone: MEETING_TIME_ZONE,
        ...options,
      }).format(date);
    },
    []
  );

  const getBogotaDayKey = useCallback(
    (value: string | number | Date | null | undefined) =>
      formatBogota(
        value,
        { year: 'numeric', month: '2-digit', day: '2-digit' },
        'en-CA'
      ),
    [formatBogota]
  );

  // Formato compacto para móviles (Ej: "Vie, Nov 8")
  const formatMobileDate = (start?: string) => {
    if (!start) return '';
    try {
      const weekday = formatBogota(start, { weekday: 'long' });
      if (!weekday) return '';
      const weekdayCapitalized =
        weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const day = formatBogota(start, { day: 'numeric' });
      const month = formatBogota(start, { month: 'long' });
      if (!month) return '';
      const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
      const year = formatBogota(start, { year: 'numeric' });
      return `${weekdayCapitalized}, ${day} de ${monthCapitalized}, ${year}`;
    } catch {
      return '';
    }
  };

  // Formato hora de inicio (ej: "7:00 p.m.")
  const formatStartTime = (start?: string) => {
    if (!start) return '';
    return formatBogota(
      start,
      { hour: 'numeric', minute: '2-digit', hour12: true },
      'es-CO'
    );
  };

  // Etiqueta legible para duración con pluralización correcta
  const formatDurationLabelLive = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      return hours === 1 ? '1 hora' : `${hours} horas`;
    }
    return `${(minutes / 60).toFixed(1)} horas`;
  };

  // Helper para calcular duración en minutos
  const getDurationMinutes = (meeting: ClassMeeting) =>
    meeting.startDateTime && meeting.endDateTime
      ? Math.round(
          (new Date(meeting.endDateTime).getTime() -
            new Date(meeting.startDateTime).getTime()) /
            60000
        )
      : 5;

  const parseDate = (value: string | null | undefined) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const _formatDateLabel = (value: string | null | undefined) => {
    const date = parseDate(value);
    if (!date) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const _formatTimeLabel = (value: string | null | undefined) => {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const _getDurationLabel = (
    start: string | null | undefined,
    end: string | null | undefined
  ) => {
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    if (!startDate || !endDate) return '';
    const minutes = Math.max(
      0,
      Math.round((endDate.getTime() - startDate.getTime()) / 60000)
    );
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const rest = minutes % 60;
      return rest ? `${hours}h ${rest}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  // Memoizar los IDs de cursos para evitar re-renders infinitos
  const courseIds = useMemo(() => {
    if (!program.materias) return [];
    return program.materias
      .map((m) => m.courseid)
      .filter((id): id is number => Boolean(id));
  }, [program.materias]);

  const liveSessionsCache = useMemo(
    () =>
      new Map<
        number,
        ClassMeeting & { courseTitle: string; courseId: number }
      >(),
    []
  );
  const lastFetchMap = useMemo(() => new Map<number, number>(), []);

  useEffect(() => {
    const fetchLiveSessions = async () => {
      if (courseIds.length === 0) {
        setLiveSessions([]);
        return;
      }

      setIsLoadingLive(true);
      try {
        const coursesWithId =
          program.materias
            ?.map((m) => ({
              courseId: m.courseid,
              courseTitle: m.curso?.title ?? 'Curso sin título',
            }))
            .filter((c): c is { courseId: number; courseTitle: string } =>
              Boolean(c.courseId)
            ) ?? [];

        // Evitar duplicados de cursos
        const uniqueCoursesWithId = Array.from(
          new Map<number, { courseId: number; courseTitle: string }>(
            coursesWithId.map((c) => [c.courseId, c])
          ).values()
        );

        const now = new Date();
        const nextClasses: Array<
          ClassMeeting & { courseTitle: string; courseId: number }
        > = [];

        await Promise.all(
          uniqueCoursesWithId.map(async ({ courseId, courseTitle }) => {
            const cached = liveSessionsCache.get(courseId);
            const lastFetched = lastFetchMap.get(courseId) ?? 0;
            const cacheIsActive =
              cached &&
              (() => {
                const start = parseDate(cached.startDateTime);
                const end = parseDate(cached.endDateTime);
                if (start && end) return end >= now;
                if (end) return end >= now;
                if (start) return start >= now;
                return false;
              })();

            if (cacheIsActive && Date.now() - lastFetched < 60_000) {
              nextClasses.push(cached);
              return;
            }

            try {
              const res = await fetch(
                `/api/estudiantes/classMeetings/by-course?courseId=${courseId}`
              );
              if (!res.ok) return;

              const data: unknown = await res.json();
              if (
                !data ||
                typeof data !== 'object' ||
                !Array.isArray((data as { meetings?: unknown }).meetings)
              ) {
                return;
              }

              const meetings = (data as { meetings: ClassMeeting[] }).meetings;

              const upcomingOrActive = meetings
                .filter((meeting) => {
                  const start = parseDate(meeting.startDateTime);
                  const end = parseDate(meeting.endDateTime);
                  if (start && end) return end >= now;
                  if (end) return end >= now;
                  if (start) return start >= now;
                  return false;
                })
                .sort((a, b) => {
                  const aStart = parseDate(a.startDateTime)?.getTime() ?? 0;
                  const bStart = parseDate(b.startDateTime)?.getTime() ?? 0;
                  return aStart - bStart;
                });

              if (upcomingOrActive.length > 0) {
                const nextMeeting = {
                  ...upcomingOrActive[0],
                  courseTitle,
                  courseId,
                };
                liveSessionsCache.set(courseId, nextMeeting);
                lastFetchMap.set(courseId, Date.now());
                nextClasses.push(nextMeeting);
              } else {
                liveSessionsCache.delete(courseId);
              }
            } catch (error) {
              console.error('Error fetching class meetings', error);
            }
          })
        );

        nextClasses.sort((a, b) => {
          const aStart = parseDate(a.startDateTime)?.getTime() ?? 0;
          const bStart = parseDate(b.startDateTime)?.getTime() ?? 0;
          return aStart - bStart;
        });

        setLiveSessions(nextClasses);
      } finally {
        setIsLoadingLive(false);
      }
    };

    void fetchLiveSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIds.join(',')]);

  // Identificar la próxima clase en vivo (la más cercana en tiempo)
  const nextMeetingId = useMemo(() => {
    if (liveSessions.length === 0) return null;
    return liveSessions[0].id;
  }, [liveSessions]);

  // Helper para verificar si una clase está disponible
  const _isMeetingAvailable = useCallback(
    (meeting: ClassMeeting): boolean => {
      if (!meeting.startDateTime) return false;
      if (meeting.id === nextMeetingId) return true;
      const todayKey = getBogotaDayKey(new Date());
      const meetingKey = getBogotaDayKey(meeting.startDateTime);
      if (!todayKey || !meetingKey) return false;
      return todayKey === meetingKey;
    },
    [nextMeetingId, getBogotaDayKey]
  );

  const handleSignInRedirect = async () => {
    toast.error('Inicio de sesión requerido', {
      description: 'Debes iniciar sesión para inscribirte en este programa',
      duration: 3000,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const currentPath = `/estudiantes/programas/${program.id}`;
    const returnUrl = encodeURIComponent(currentPath);
    window.location.href = `/sign-in?redirect_url=${returnUrl}`;
  };

  const handleEnrollClick = async () => {
    if (!canEnroll) {
      window.open('/planes', '_blank', 'noopener,noreferrer');
      return;
    }
    await onEnrollAction();
  };

  const handleUnenrollDialogChange = (open: boolean) => {
    if (!open && isUnenrolling) return;
    setShowUnenrollDialog(open);
  };

  const handleConfirmUnenroll = async () => {
    await onUnenrollAction();
    setShowUnenrollDialog(false);
  };

  const _canAccessGrades = isEnrolled;

  // Renderizar un botón simplificado en SSR, para evitar diferencias de hidratación
  const renderEnrollmentButton = (_showCertificate = true) => {
    // Si estamos en el servidor o no se ha hidratado aún, mostrar un botón estático básico
    if (!isClient) {
      return (
        <button
          type="button"
          disabled
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-base font-semibold text-primary-foreground opacity-60 transition-all"
        >
          Cargando...
        </button>
      );
    }

    // En el cliente (después de hidratación), mostrar el botón completo
    if (!isSignedIn) {
      return (
        <button
          type="button"
          onClick={handleSignInRedirect}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-base font-semibold whitespace-nowrap text-primary-foreground ring-offset-background transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        >
          Iniciar sesión
        </button>
      );
    } else if (isEnrolled) {
      return (
        <div className="group relative">
          <button
            type="button"
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#10b9814d] bg-emerald-500/20 px-4 py-2 text-base font-semibold whitespace-nowrap text-emerald-400 ring-offset-background transition-all hover:bg-[#10b9814d] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <FaCheck
              className="mr-2 h-5 w-5"
              style={{ color: 'rgb(52 211 153)' }}
            />
            Suscrito
          </button>
          <button
            type="button"
            aria-label="Cancelar suscripción al programa"
            onClick={() => setShowUnenrollDialog(true)}
            disabled={isUnenrolling}
            className="group absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-destructive/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            <FaTimes className="h-4 w-4 text-emerald-400 transition-colors group-hover:text-red-500" />
          </button>
        </div>
      );
    } else {
      const isDisabled = isEnrolling || isCheckingEnrollment;

      return (
        <button
          type="button"
          onClick={handleEnrollClick}
          disabled={isDisabled}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-base font-semibold whitespace-nowrap text-primary-foreground ring-offset-background transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        >
          {isCheckingEnrollment ? (
            <>
              <Icons.spinner className="size-4 text-primary-foreground" />
              Cargando...
            </>
          ) : isEnrolling ? (
            <>
              <Icons.spinner className="size-4 text-primary-foreground" />
              Inscribiendo…
            </>
          ) : !canEnroll ? (
            'Obtener Plan Premium'
          ) : (
            <span style={{ color: '#080c16' }}>Inscribirme al programa</span>
          )}
        </button>
      );
    }
  };

  const renderCtaCard = () => (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{ backgroundColor: '#061c37', borderColor: '#1d283a' }}
    >
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={coverImageUrl}
              alt={program.title}
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 33vw"
              quality={85}
              placeholder="blur"
              blurDataURL={blurDataURL}
            />
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(6, 28, 55, 0.1) 35%, rgba(6, 28, 55, 0.3) 50%, rgba(6, 28, 55, 0.6) 65%, rgba(6, 28, 55, 0.85) 80%, rgba(6, 28, 55, 0.95) 90%, #061c37 100%)',
                willChange: 'transform',
              }}
            />
          </div>
        </AspectRatio>
      </div>
      <div className="relative z-10 space-y-5 p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400">
          <Crown className="h-4 w-4" />
          Programa Premium
        </div>
        <div className="space-y-3">{renderEnrollmentButton()}</div>
      </div>
    </div>
  );

  const ratingValue = program.rating?.toFixed(1) ?? '0.0';
  const totalCourses = courses.length;

  return (
    <>
      <div
        className="relative rounded-2xl border border-border/50 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm md:p-8"
        style={{
          backgroundImage: `url(${coverImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
        }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-background via-background/95 to-background/80" />
        <div className="relative z-10 mb-8 lg:hidden">{renderCtaCard()}</div>
        <div
          className={`relative z-10 grid grid-cols-1 gap-8 ${
            isEnrolled ? 'lg:grid-cols-1' : 'lg:grid-cols-3'
          }`}
        >
          <div
            className={`${isEnrolled ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-8`}
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                {/* Badge de categoría */}
                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                  {program.category?.name ?? 'Sin categoría'}
                </div>
              </div>
              <h1 className="font-display text-3xl leading-tight font-bold text-foreground md:text-4xl">
                <span className="inline">
                  {program.title}{' '}
                  {isEnrolled && (
                    <CheckCircleIcon className="mb-1 ml-1 inline-block h-6 w-6 flex-shrink-0 align-middle text-green-500" />
                  )}
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon
                      key={index}
                      className={`h-4 w-4 ${
                        index < Math.floor(program.rating ?? 0)
                          ? 'text-amber-400'
                          : 'text-amber-400/50'
                      }`}
                    />
                  ))}
                  <span className="ml-1 font-semibold text-amber-400">
                    {ratingValue}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: '#1a23334d' }}
                >
                  <Book className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">
                    {totalCourses}
                  </p>
                  <p className="text-xs text-muted-foreground">Cursos</p>
                </div>
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: '#1a23334d' }}
                >
                  <Clock className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">
                    {totalContentLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">Contenido</p>
                </div>
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: '#1a23334d' }}
                >
                  <Users className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">
                    {enrollmentCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Estudiantes</p>
                </div>
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: '#1a23334d' }}
                >
                  <Video className="mx-auto mb-1 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">
                    {liveSessionsCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Clases en vivo
                  </p>
                </div>
              </div>

              {/* Badge de tipo de certificación */}
              {program.certificationType && (
                <div className="flex w-fit items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
                  <LiaCertificateSolid className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    {program.certificationType.name}
                  </span>
                </div>
              )}

              <p className="text-base leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {program.description ?? 'No hay descripción disponible.'}
              </p>
            </div>

            <Tabs.Root
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as 'cursos' | 'en-vivo' | 'certificacion')
              }
              className="w-full"
            >
              <div className="border-b border-border/50">
                <Tabs.List className="inline-flex h-auto w-full flex-nowrap items-center justify-start overflow-x-auto rounded-md bg-transparent p-0 text-muted-foreground">
                  <Tabs.Trigger
                    value="cursos"
                    className="flex items-center justify-center gap-2 rounded-none bg-transparent px-4 py-3 text-sm font-medium whitespace-nowrap text-muted-foreground ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <Book className="h-4 w-4" />
                    Cursos
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="en-vivo"
                    className="flex items-center justify-center gap-2 rounded-none bg-transparent px-4 py-3 text-sm font-medium whitespace-nowrap text-muted-foreground ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <Video className="h-4 w-4" />
                    En Vivo
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="certificacion"
                    className="flex items-center justify-center gap-2 rounded-none bg-transparent px-4 py-3 text-sm font-medium whitespace-nowrap text-muted-foreground ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <Award className="h-4 w-4" />
                    Certificación
                  </Tabs.Trigger>
                </Tabs.List>
              </div>
              <Tabs.Content value="cursos" className="pt-6">
                <ProgramContent
                  program={program}
                  isEnrolled={isEnrolled}
                  isSubscriptionActive={isSubscriptionActive}
                />
              </Tabs.Content>
              <Tabs.Content value="en-vivo" className="pt-6">
                <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-full bg-red-500/20 p-2">
                      <LuVideo className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">
                        Clases en Vivo
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Lista de sesiones en vivo de los cursos del programa
                      </p>
                    </div>
                  </div>
                  {isLoadingLive || isLoadingEnrollments ? (
                    <div className="flex items-center justify-center py-12">
                      <Icons.spinner className="h-8 w-8 text-primary" />
                    </div>
                  ) : liveSessions.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No hay clases en vivo programadas en este momento
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Las clases en vivo se anunciarán próximamente
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {liveSessions.map((meeting) => {
                        const isEnrolledInCourse =
                          !!courseEnrollments[meeting.courseId];

                        // Determinar si es hoy usando la zona horaria de Bogotá
                        let isToday = false;
                        let isJoinEnabled = false;
                        let isMeetingEnded = false;
                        if (meeting.startDateTime && meeting.endDateTime) {
                          const now = new Date();
                          const todayKey = getBogotaDayKey(now);
                          const meetingKey = getBogotaDayKey(
                            meeting.startDateTime
                          );
                          if (todayKey && meetingKey) {
                            const end = toSafeDate(meeting.endDateTime);
                            if (end) {
                              isToday = meetingKey === todayKey;
                              isMeetingEnded = now > end;
                              isJoinEnabled = isToday && !isMeetingEnded;
                            }
                          }
                        }

                        // --- Botón: color según estado ---
                        const buttonClass =
                          'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all border-0';
                        let buttonBg = '';
                        let buttonDisabled = false;
                        let buttonText = '';
                        let buttonIcon: React.ReactNode = null;
                        let buttonExtraClass = '';

                        // Si no está inscrito en el curso, mostrar "Inscribirse al curso"
                        if (!isEnrolledInCourse) {
                          buttonBg =
                            'bg-primary text-primary-foreground hover:bg-primary/90';
                          buttonDisabled = false;
                          buttonText =
                            'Inscribirse al curso para ver la clase en vivo';
                          buttonIcon = <Book className="mr-2 h-4 w-4" />;
                        } else if (isToday && isJoinEnabled) {
                          buttonBg = 'bg-red-600 text-white hover:bg-red-700';
                          buttonDisabled = false;
                          buttonText = 'Unirse Ahora';
                          buttonIcon = (
                            <LuSquareArrowOutUpRight
                              className="mr-2 inline-block h-4 w-4"
                              style={{ flexShrink: 0 }}
                            />
                          );
                        } else {
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
                        }

                        return (
                          <div
                            key={`course-${meeting.courseId}`}
                            className={`sm:hover:neon-live-class relative flex flex-col gap-3 rounded-[12px] border p-3 ${isEnrolledInCourse ? 'sm:flex-row sm:items-center sm:justify-between' : ''} sm:p-4`}
                            style={{
                              backgroundColor: '#01152d',
                              borderColor: 'hsla(217, 33%, 17%, 0.5)',
                            }}
                          >
                            {/* MOBILE: layout vertical y centrado */}
                            <div className="block w-full sm:hidden">
                              <div className="flex w-full flex-col items-stretch gap-3">
                                {/* Badge del curso arriba del título */}
                                <span className="inline-flex w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                  {meeting.courseTitle}
                                </span>
                                {/* Header compacto */}
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
                                      VIVO
                                    </span>
                                    <h3 className="text-lg leading-snug font-semibold text-slate-100">
                                      {meeting.title}
                                    </h3>
                                  </div>
                                </div>
                                {/* Chips fecha+hora y duración */}
                                <div
                                  className="flex items-center gap-2 text-sm whitespace-nowrap"
                                  style={{
                                    color: '#94a3b8',
                                    background: '#01152d',
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
                                    {formatStartTime(meeting.startDateTime)} (
                                    {formatDurationLabelLive(
                                      getDurationMinutes(meeting)
                                    )}
                                    )
                                  </span>
                                </div>
                                {/* Botón móvil */}
                                <div className="flex w-full justify-center">
                                  {!isEnrolledInCourse ? (
                                    <Link
                                      href={`/estudiantes/cursos/${meeting.courseId}`}
                                      className={`${buttonClass} ${buttonBg} text-center`}
                                      style={{
                                        fontFamily:
                                          'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                        whiteSpace: 'nowrap',
                                        color: '#080c16',
                                      }}
                                    >
                                      {buttonIcon}
                                      <span className="relative z-10 whitespace-nowrap">
                                        {buttonText}
                                      </span>
                                    </Link>
                                  ) : isToday &&
                                    isJoinEnabled &&
                                    meeting.joinUrl ? (
                                    <a
                                      href={meeting.joinUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`${buttonClass} ${buttonBg}`}
                                      style={{
                                        fontFamily:
                                          'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                      }}
                                    >
                                      {buttonIcon}
                                      <span className="relative z-10 whitespace-nowrap">
                                        {buttonText}
                                      </span>
                                    </a>
                                  ) : (
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
                                      <span className="relative z-10 whitespace-nowrap">
                                        {buttonText}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* DESKTOP: badge + title en una línea, fecha/hora debajo */}
                            <div className="hidden min-w-0 flex-1 flex-col gap-2 sm:flex">
                              <div className="flex items-center gap-3">
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                  {meeting.courseTitle}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                                  VIVO
                                </span>
                                <div className="text-base leading-tight font-semibold text-slate-100">
                                  {meeting.title}
                                </div>
                              </div>
                              <div
                                className="flex items-center gap-2 text-sm whitespace-nowrap"
                                style={{
                                  color: '#94a3b8',
                                  background: '#01152d',
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
                                  {formatStartTime(meeting.startDateTime)} (
                                  {formatDurationLabelLive(
                                    getDurationMinutes(meeting)
                                  )}
                                  )
                                </span>
                              </div>
                            </div>
                            {/* Botón desktop debajo de fecha/hora y centrado o a la derecha */}
                            <div
                              className={`mt-2 hidden ${isEnrolledInCourse ? 'sm:flex sm:justify-end' : 'w-full justify-center sm:flex'}`}
                            >
                              {!isEnrolledInCourse ? (
                                <Link
                                  href={`/estudiantes/cursos/${meeting.courseId}`}
                                  className={`${buttonClass} ${buttonBg} text-center`}
                                  style={{
                                    fontFamily:
                                      'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                    whiteSpace: 'nowrap',
                                    color: '#080c16',
                                  }}
                                >
                                  {buttonIcon}
                                  <span className="relative z-10 whitespace-nowrap">
                                    {buttonText}
                                  </span>
                                </Link>
                              ) : isToday &&
                                isJoinEnabled &&
                                meeting.joinUrl ? (
                                <a
                                  href={meeting.joinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${buttonClass} ${buttonBg}`}
                                  style={{
                                    fontFamily:
                                      'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                  }}
                                >
                                  {buttonIcon}
                                  <span className="relative z-10 whitespace-nowrap">
                                    {buttonText}
                                  </span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  className={`${buttonClass} ${buttonExtraClass} ${buttonBg}`}
                                  disabled={buttonDisabled}
                                  style={{
                                    fontFamily:
                                      'var(--font-montserrat), "Montserrat", "Istok Web", sans-serif',
                                  }}
                                >
                                  {buttonIcon}
                                  <span className="relative z-10 whitespace-nowrap">
                                    {buttonText}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </Tabs.Content>
              <Tabs.Content value="certificacion" className="pt-6">
                <ProgramCertificationPanel
                  program={program}
                  isEnrolled={isEnrolled}
                />
              </Tabs.Content>
            </Tabs.Root>
          </div>
          {!isEnrolled && (
            <div className="sticky top-24 hidden max-h-[calc(100vh-8rem)] self-start lg:block">
              {renderCtaCard()}
            </div>
          )}
        </div>
      </div>
      <ProgramGradesModal
        isOpen={isGradeModalOpen}
        onCloseAction={() => setIsGradeModalOpen(false)}
        programTitle={program.title}
        finalGrade={programAverage}
        isLoading={isLoadingGrade}
        coursesGrades={coursesGrades}
        programId={program.id}
        materias={program.materias ?? []}
      />
      {isCertModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-lg rounded-lg border border-gray-200 bg-[#01142B] p-6">
            <button
              onClick={() => setIsCertModalOpen(false)}
              className="absolute top-2 right-2 text-primary transition-colors hover:text-secondary"
              type="button"
              aria-label="Cerrar"
            >
              <IoCloseOutline className="h-8 w-8" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <Image
                src="/diploma-certificate.svg"
                alt="Certificado del Programa"
                width={120}
                height={120}
                className="mb-2"
              />
              <p className="text-center font-serif text-lg text-primary italic">
                ¡Felicitaciones! Has completado exitosamente el programa con una
                calificación sobresaliente. Tu certificado está listo para ser
                visualizado y compartido.
              </p>
              <Link href={`/estudiantes/certificados/programa/${program.id}`}>
                <button className="certificado-modal-button">
                  <span className="relative z-10">
                    Ver Certificado del Programa
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
      <Dialog
        open={showUnenrollDialog}
        onOpenChange={handleUnenrollDialogChange}
      >
        <DialogContent className="border border-[#1D283A] bg-[#061c37] sm:rounded-[16px]">
          <DialogHeader className="space-y-2 text-center sm:text-left">
            <DialogTitle className="text-[#f8fafc]">¿Estás seguro?</DialogTitle>
            <DialogDescription className="text-[#94a3b8]">
              ¿Estás seguro que quieres cancelar tu suscripción al programa?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
            <button
              type="button"
              onClick={() => setShowUnenrollDialog(false)}
              disabled={isUnenrolling}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#1D283A] bg-[#01152d] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#22C4D3] hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmUnenroll}
              disabled={isUnenrolling}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#7c1d1d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#991b1b] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              {isUnenrolling ? 'Procesando…' : 'Aceptar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
