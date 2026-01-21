'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Award,
  Book,
  Calendar,
  Clock,
  Crown,
  ExternalLink,
  Users,
  Video,
} from 'lucide-react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { IoCloseOutline } from 'react-icons/io5';
import { LiaCertificateSolid } from 'react-icons/lia';
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

import '~/styles/certificado-modal.css';
import '~/styles/certificadobutton.css';
import '~/styles/certificadobutton2.css';

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
    (ClassMeeting & { courseTitle: string })[]
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

  const parseDate = (value: string | null | undefined) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDateLabel = (value: string | null | undefined) => {
    const date = parseDate(value);
    if (!date) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const formatTimeLabel = (value: string | null | undefined) => {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDurationLabel = (
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

  useEffect(() => {
    const fetchLiveSessions = async () => {
      if (!program.materias || program.materias.length === 0) {
        setLiveSessions([]);
        return;
      }

      setIsLoadingLive(true);
      try {
        const coursesWithId = program.materias
          .map((m) => ({
            courseId: m.courseid,
            courseTitle: m.curso?.title ?? 'Curso sin título',
          }))
          .filter((c): c is { courseId: number; courseTitle: string } =>
            Boolean(c.courseId)
          );

        const results = await Promise.all(
          coursesWithId.map(async ({ courseId, courseTitle }) => {
            try {
              const res = await fetch(
                `/api/estudiantes/classMeetings/by-course?courseId=${courseId}`
              );
              if (!res.ok)
                return [] as (ClassMeeting & { courseTitle: string })[];
              const data: unknown = await res.json();
              if (
                !data ||
                typeof data !== 'object' ||
                !Array.isArray((data as { meetings?: unknown }).meetings)
              ) {
                return [] as (ClassMeeting & { courseTitle: string })[];
              }

              const meetings = (data as { meetings: ClassMeeting[] }).meetings;
              return meetings.map((meeting) => ({
                ...meeting,
                courseTitle,
              }));
            } catch (error) {
              console.error('Error fetching class meetings', error);
              return [] as (ClassMeeting & { courseTitle: string })[];
            }
          })
        );

        const now = new Date();
        const flattened = results
          .flat()
          .filter((meeting) => {
            const start = parseDate(meeting.startDateTime);
            return start ? start >= now : false;
          })
          .sort((a, b) => {
            const aStart = parseDate(a.startDateTime)?.getTime() ?? 0;
            const bStart = parseDate(b.startDateTime)?.getTime() ?? 0;
            return aStart - bStart;
          });

        setLiveSessions(flattened);
      } finally {
        setIsLoadingLive(false);
      }
    };

    void fetchLiveSessions();
  }, [program.materias]);

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
        <div className="space-y-3">
          {renderEnrollmentButton()}
          <p className="text-center text-xs text-muted-foreground">
            Accede a este y a más de{' '}
            <span className="font-medium text-white">50 programas</span> con el
            plan PREMIUM.{' '}
            <Link
              href="/planes"
              className="font-semibold text-white underline-offset-4 hover:underline"
            >
              Ver planes
            </Link>
          </p>
        </div>
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
        <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
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
                    <div className="rounded-lg bg-red-500/20 p-2">
                      <Video className="h-5 w-5 text-red-400" />
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
                  {isLoadingLive ? (
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
                    <div className="space-y-3">
                      {liveSessions.map((meeting) => {
                        const durationLabel = getDurationLabel(
                          meeting.startDateTime,
                          meeting.endDateTime
                        );

                        return (
                          <div
                            key={`${meeting.id}-${meeting.courseId}`}
                            className="space-y-3 rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-foreground">
                                    {meeting.title}
                                  </h3>
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                    {meeting.courseTitle}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateLabel(meeting.startDateTime)}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {formatTimeLabel(meeting.startDateTime)}
                                    {durationLabel ? ` (${durationLabel})` : ''}
                                  </span>
                                </div>
                              </div>
                              {meeting.joinUrl ? (
                                <a
                                  href={meeting.joinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent/20 px-3 text-sm font-medium whitespace-nowrap text-accent ring-offset-background transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Ver enlace
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-muted px-3 text-sm font-medium whitespace-nowrap text-muted-foreground ring-offset-background transition-colors"
                                  disabled
                                >
                                  Enlace no disponible
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
          <div className="sticky top-24 hidden max-h-[calc(100vh-8rem)] self-start lg:block">
            {renderCtaCard()}
          </div>
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
