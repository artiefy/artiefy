'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { AiFillFire, AiOutlineCalendar } from 'react-icons/ai';
import { FaCheck, FaCrown, FaStar, FaTimes } from 'react-icons/fa';
import { IoPlayOutline } from 'react-icons/io5';
import { MdOutlineVideocam } from 'react-icons/md';
import { toast } from 'sonner';

import { CourseActivities } from '~/components/estudiantes/layout/coursedetail/CourseActivities';
import { CourseBreadcrumb } from '~/components/estudiantes/layout/coursedetail/CourseBreadcrumb';
import CourseComments from '~/components/estudiantes/layout/coursedetail/CourseComments';
import { CourseContent } from '~/components/estudiantes/layout/coursedetail/CourseContent';
import { CourseDetailsSkeleton } from '~/components/estudiantes/layout/coursedetail/CourseDetailsSkeleton';
import { CourseForum } from '~/components/estudiantes/layout/coursedetail/CourseForum';
import { ProjectsSection } from '~/components/estudiantes/layout/coursedetail/ProjectsSection';
import { ResourcesSection } from '~/components/estudiantes/layout/coursedetail/ResourcesSection';
import MiniLoginModal from '~/components/estudiantes/layout/MiniLoginModal';
import PaymentForm from '~/components/estudiantes/layout/PaymentForm';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { enrollInCourse } from '~/server/actions/estudiantes/courses/enrollInCourse';
import { unenrollFromCourse } from '~/server/actions/estudiantes/courses/unenrollFromCourse';
import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
import { sortLessons } from '~/utils/lessonSorting';
import { createProductFromCourse } from '~/utils/paygateway/products';

import type { ClassMeeting, Course, Enrollment } from '~/types';

type UserMetadata = {
  planType?: 'none' | 'Pro' | 'Premium';
  subscriptionEndDate?: string | null;
  subscriptionStatus?: 'active' | 'inactive' | 'canceled' | string;
};

type CourseTypeLike = {
  isPurchasableIndividually?: boolean | null;
  requiredSubscriptionLevel?: 'none' | 'pro' | 'premium' | null;
  price?: number | null;
};

type CourseTypeCounts = {
  premium: number;
  pro: number;
  free: number;
  individual: number;
};

type NavKey =
  | 'curso'
  | 'grabadas'
  | 'proyectos'
  | 'recursos'
  | 'actividades'
  | 'foro';

export default function CourseDetails({
  course: initialCourse,
  classMeetings = [],
  courseTypeCounts = { premium: 0, pro: 0, free: 0, individual: 0 },
}: {
  course: Course;
  classMeetings?: ClassMeeting[];
  courseTypeCounts?: CourseTypeCounts;
}) {
  // Mantener la lógica de estado y autenticación
  const [course, setCourse] = useState<Course>(initialCourse);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [totalStudents, setTotalStudents] = useState(course.totalStudents);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [_isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingOpenPayment, setPendingOpenPayment] = useState(false);
  const [seenSections, setSeenSections] = useState<Record<NavKey, boolean>>({
    curso: true,
    grabadas: false,
    proyectos: false,
    recursos: false,
    actividades: false,
    foro: false,
  });
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const userMetadata = user?.publicMetadata as UserMetadata | undefined;

  const courseTypes = useMemo<CourseTypeLike[]>(() => {
    // Combine the main course.courseType (from course_type_id) with any
    // related course.courseTypes from the join table and remove duplicates.
    const combined: CourseTypeLike[] = [];
    if (course.courseType) combined.push(course.courseType as CourseTypeLike);
    const fromArray = (course as { courseTypes?: CourseTypeLike[] })
      .courseTypes;
    if (Array.isArray(fromArray)) combined.push(...fromArray);

    // Deduplicate by requiredSubscriptionLevel + isPurchasableIndividually + price
    const map = new Map<string, CourseTypeLike>();
    combined.forEach((t) => {
      const key = `${t.requiredSubscriptionLevel ?? 'none'}::${t.isPurchasableIndividually ? '1' : '0'}::${t.price ?? ''}`;
      if (!map.has(key)) map.set(key, t);
    });

    return Array.from(map.values());
  }, [course]);

  const programInfo = useMemo(() => {
    const maybeProgram = (
      course as { program?: { id?: number | string; title?: string } }
    ).program;
    if (maybeProgram && (maybeProgram.id ?? maybeProgram.title)) {
      return {
        id: String(maybeProgram.id ?? ''),
        title: maybeProgram.title ?? '',
      };
    }
    return undefined;
  }, [course]);

  const [viewMode, setViewMode] = useState<'live' | 'recorded'>('live');
  const [activePill, setActivePill] = useState<NavKey>('curso');
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const recordedCount = Array.isArray(classMeetings)
    ? classMeetings.filter((m) => !!m.video_key).length
    : 0;
  const resourcesCount = Array.isArray(course.lessons)
    ? course.lessons.filter((l) => l.resourceKey && l.resourceKey.trim() !== '')
        .length
    : 0;
  const lessonsWithActivities = useMemo(
    () =>
      Array.isArray(course.lessons)
        ? sortLessons(course.lessons).filter(
            (lesson) =>
              Array.isArray(lesson.activities) && lesson.activities.length > 0
          )
        : [],
    [course.lessons]
  );

  const activitiesStats = useMemo(() => {
    const total = lessonsWithActivities.reduce(
      (acc, lesson) => acc + (lesson.activities?.length ?? 0),
      0
    );

    const completed = lessonsWithActivities.reduce((acc, lesson) => {
      const completedPerLesson =
        lesson.activities?.filter(
          (activity) =>
            activity.isCompleted || (activity.userProgress ?? 0) >= 100
        ).length ?? 0;
      return acc + completedPerLesson;
    }, 0);

    const pending = Math.max(total - completed, 0);

    return { total, completed, pending };
  }, [lessonsWithActivities]);

  const unseenCounts = useMemo<Record<NavKey, number>>(
    () => ({
      curso: 0,
      grabadas: recordedCount,
      proyectos: projectsCount,
      recursos: resourcesCount,
      actividades: activitiesStats.total,
      foro: 0,
    }),
    [activitiesStats.total, projectsCount, recordedCount, resourcesCount]
  );
  // Persistir último conteo visto por sección para calcular "nuevos" desde la última visita
  const [lastSeenCounts, setLastSeenCounts] = useState<Record<
    NavKey,
    number
  > | null>(null);

  useEffect(() => {
    if (!userId) return;
    const storageKey = `course_seen_counts_${course.id}_${userId}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setLastSeenCounts(JSON.parse(raw) as Record<NavKey, number>);
      } else {
        // Primera visita: inicializar snapshot con los contadores actuales
        const initial: Record<NavKey, number> = {
          curso: unseenCounts.curso,
          grabadas: unseenCounts.grabadas,
          proyectos: unseenCounts.proyectos,
          recursos: unseenCounts.recursos,
          actividades: unseenCounts.actividades,
          foro: unseenCounts.foro,
        };
        localStorage.setItem(storageKey, JSON.stringify(initial));
        setLastSeenCounts(initial);
      }
    } catch (err) {
      // Si falló el acceso a localStorage, no bloquear la UI
      console.warn('No se pudo leer lastSeenCounts:', err);
      setLastSeenCounts({
        curso: 0,
        grabadas: 0,
        proyectos: 0,
        recursos: 0,
        actividades: 0,
        foro: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, userId]);

  // Calcula cuántos items nuevos hay desde la última vez que el usuario vio cada sección
  const badgeCounts = useMemo<Record<NavKey, number>>(() => {
    const result: Record<NavKey, number> = {
      curso: 0,
      grabadas: 0,
      proyectos: 0,
      recursos: 0,
      actividades: 0,
      foro: 0,
    };
    if (!lastSeenCounts) return result;
    (Object.keys(unseenCounts) as NavKey[]).forEach((k) => {
      const prev = lastSeenCounts[k] ?? 0;
      const cur = unseenCounts[k] ?? 0;
      const delta = Math.max(0, cur - prev);
      // Si el usuario ya marcó la sección como vista, ocultar badge
      result[k] = seenSections[k] ? 0 : delta;
    });
    // Solo mostrar badges cuando el usuario esté inscrito
    if (!isEnrolled) {
      (Object.keys(result) as NavKey[]).forEach((k) => (result[k] = 0));
    }
    return result;
  }, [unseenCounts, lastSeenCounts, seenSections, isEnrolled]);
  const navItems: Array<{ key: NavKey; label: string; helper?: string }> = [
    {
      key: 'curso',
      label: 'Curso',
      helper: undefined,
    },
    {
      key: 'grabadas',
      label: 'Clases grabadas',
      helper: undefined,
    },
    {
      key: 'proyectos',
      label: 'Proyectos',
      helper: undefined,
    },
    {
      key: 'recursos',
      label: 'Recursos',
      helper: undefined,
    },
    {
      key: 'actividades',
      label: 'Actividades',
      helper: undefined,
    },
    { key: 'foro', label: 'Foro', helper: undefined },
  ];

  const sectionLabels: Record<NavKey, string> = {
    curso: 'el contenido del curso',
    grabadas: 'las clases grabadas',
    proyectos: 'los proyectos',
    recursos: 'los recursos',
    actividades: 'las actividades',
    foro: 'el foro',
  };

  const handlePillClick = (key: NavKey) => {
    setActivePill(key);
    setSeenSections((prev) => ({ ...prev, [key]: true }));
    // Actualizar snapshot en localStorage para que el badge desaparezca y
    // futuros items se calculen desde este punto.
    if (userId) {
      const storageKey = `course_seen_counts_${course.id}_${userId}`;
      try {
        const prev = lastSeenCounts ?? {
          curso: 0,
          grabadas: 0,
          proyectos: 0,
          recursos: 0,
          actividades: 0,
          foro: 0,
        };
        const updated = { ...prev, [key]: unseenCounts[key] };
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setLastSeenCounts(updated);
      } catch (err) {
        console.warn('No se pudo actualizar lastSeenCounts:', err);
      }
    }
    if (key === 'grabadas') setViewMode('recorded');
    else setViewMode('live');
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    const container = carouselRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.65;
    container.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const subscriptionEndDate = userMetadata?.subscriptionEndDate ?? null;

  // Obtener conteo de proyectos
  useEffect(() => {
    const fetchProjectsCount = async () => {
      if (isSignedIn && userId) {
        try {
          const response = await fetch(
            `/api/estudiantes/projects?courseId=${course.id}`
          );
          if (response.ok) {
            const data = await response.json();
            setProjectsCount(Array.isArray(data) ? data.length : 0);
          }
        } catch (error) {
          console.error('Error al obtener proyectos:', error);
        }
      }
    };

    void fetchProjectsCount();
  }, [isSignedIn, userId, course.id]);

  useEffect(() => {
    if (initialCourse.isActive === false) {
      toast.error('Curso no disponible', {
        description: 'Este curso no está disponible actualmente.',
        duration: 2000,
        id: 'course-unavailable',
      });
      router.replace('/estudiantes');
    }
  }, [initialCourse.isActive, router]);

  // Variables reutilizables sobre tipos de curso y suscripción del usuario
  const _hasPurchasable = courseTypes.some((t) => t.isPurchasableIndividually);
  const _hasPremium = courseTypes.some(
    (t) => t.requiredSubscriptionLevel === 'premium'
  );
  const _hasPro = courseTypes.some(
    (t) => t.requiredSubscriptionLevel === 'pro'
  );
  const _hasFree = courseTypes.some(
    (t) =>
      t.requiredSubscriptionLevel === 'none' && !t.isPurchasableIndividually
  );
  const _userPlanType = userMetadata?.planType;
  const _normalizedPlan = _userPlanType?.toLowerCase();
  const _hasActiveSubscription =
    isSignedIn &&
    (_normalizedPlan === 'pro' || _normalizedPlan === 'premium') &&
    isSubscriptionActive;

  const includedPlans = useMemo(() => {
    const plans: Array<'Premium' | 'Pro'> = [];
    if (_hasPremium) plans.push('Premium');
    if (_hasPro) plans.push('Pro');
    return plans;
  }, [_hasPremium, _hasPro]);

  const userIncludedPlanLabel = useMemo(() => {
    if (_userPlanType === 'Premium' && _hasPremium) return 'Premium';
    if (_userPlanType === 'Pro' && _hasPro) return 'Pro';
    return null;
  }, [_hasPremium, _hasPro, _userPlanType]);

  const activeCourseTypes = useMemo(
    () => ({
      hasPremium: courseTypes.some(
        (t) => t.requiredSubscriptionLevel === 'premium'
      ),
      hasPro: courseTypes.some((t) => t.requiredSubscriptionLevel === 'pro'),
      hasFree: courseTypes.some(
        (t) =>
          t.requiredSubscriptionLevel === 'none' && !t.isPurchasableIndividually
      ),
      hasIndividual: courseTypes.some((t) => t.isPurchasableIndividually),
    }),
    [courseTypes]
  );

  const totalSimilarCourses = useMemo(() => {
    const sum =
      (activeCourseTypes.hasPremium
        ? Number(courseTypeCounts.premium ?? 0)
        : 0) +
      (activeCourseTypes.hasPro ? Number(courseTypeCounts.pro ?? 0) : 0) +
      (activeCourseTypes.hasFree ? Number(courseTypeCounts.free ?? 0) : 0) +
      (activeCourseTypes.hasIndividual
        ? Number(courseTypeCounts.individual ?? 0)
        : 0);

    return sum > 0 ? sum : 200;
  }, [activeCourseTypes, courseTypeCounts]);

  const planPhrase = useMemo(() => {
    const { hasPremium, hasPro, hasFree, hasIndividual } = activeCourseTypes;

    if (hasPremium && hasPro && hasIndividual) {
      return 'los planes Premium y Pro o compra individual';
    }
    if (hasPremium && hasPro && hasFree) {
      return 'los planes Premium y Pro o cursos gratis';
    }
    if (hasPremium && hasPro) return 'los planes Premium y Pro';
    if (hasPremium && hasIndividual)
      return 'el plan Premium o compra individual';
    if (hasPro && hasIndividual) return 'el plan Pro o compra individual';
    if (hasPremium && hasFree) return 'el plan Premium o cursos gratis';
    if (hasPro && hasFree) return 'el plan Pro o cursos gratis';
    if (hasIndividual && hasFree) return 'compra individual o cursos gratis';
    if (hasPremium) return 'el plan Premium';
    if (hasPro) return 'el plan Pro';
    if (hasIndividual) return 'compra individual';
    if (hasFree) return 'los cursos gratis';
    return 'nuestro catálogo';
  }, [activeCourseTypes]);

  const formatPrice = (val?: number | string | null) => {
    const digits = val == null ? '' : String(val).replace(/\D/g, '');
    const base = digits || '450000';
    return base.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const courseProduct = useMemo(() => {
    const fallbackPrice =
      course.individualPrice ?? course.courseType?.price ?? 0;
    return createProductFromCourse({
      id: Number(course.id),
      title: course.title,
      individualPrice: fallbackPrice,
    });
  }, [
    course.id,
    course.individualPrice,
    course.courseType?.price,
    course.title,
  ]);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingOpenPayment) {
      setPendingOpenPayment(false);
      setShowPaymentModal(true);
      return;
    }
    // Si no había pago pendiente, continuar flujo normal con sesión activa
    void handleStartNow();
  };

  const handleStartNow = async () => {
    const types = courseTypes;
    const hasPurchasable = types.some((t) => t.isPurchasableIndividually);
    const normalizedPlan = _userPlanType?.toLowerCase();
    const hasPlanAccess =
      _hasActiveSubscription &&
      ((_hasPremium &&
        _hasPro &&
        (normalizedPlan === 'premium' || normalizedPlan === 'pro')) ||
        (_hasPremium && !_hasPro && normalizedPlan === 'premium') ||
        (!_hasPremium &&
          _hasPro &&
          (normalizedPlan === 'pro' || normalizedPlan === 'premium')));

    const shouldOpenPayment = _hasFree
      ? false
      : !hasPlanAccess && (hasPurchasable || !_hasActiveSubscription);

    if (!isSignedIn) {
      setPendingOpenPayment(shouldOpenPayment);
      setShowLoginModal(true);
      return;
    }

    if (shouldOpenPayment) {
      if (!hasPurchasable) {
        router.push('/planes');
        return;
      }
      setShowPaymentModal(true);
      return;
    }

    if (!course?.id || !userId) {
      toast.error('No pudimos identificar tu cuenta. Intenta nuevamente.');
      return;
    }

    const courseId = Number(course.id);
    setIsEnrolling(true);

    try {
      const enrollment = await enrollInCourse(courseId);

      if (!enrollment.success) {
        toast.error('No pudimos inscribirte', {
          description: enrollment.message,
        });
        if (enrollment.requiresSubscription) {
          router.push('/planes');
        }
        return;
      }

      toast.success('¡Inscripción exitosa!', {
        description: 'Ya tienes acceso al contenido del curso.',
      });
      setIsEnrolled(true);
      setTotalStudents((prev) => (prev ?? 0) + 1);

      const lessons = await getLessonsByCourseId(courseId, userId);
      if (lessons) {
        const normalizedLessons = lessons.map((lesson) => ({
          ...lesson,
          isLocked: lesson.isLocked,
          porcentajecompletado: lesson.userProgress,
          isNew: lesson.isNew,
        }));
        setCourse((prev) => ({
          ...prev,
          lessons: sortLessons(normalizedLessons),
        }));
      }
    } catch (error) {
      console.error('Error enrolling user:', error);
      toast.error('Ocurrió un error al inscribirte. Inténtalo de nuevo.');
    } finally {
      setIsEnrolling(false);
    }
  };

  useEffect(() => {
    const checkEnrollmentAndProgress = async () => {
      setIsCheckingEnrollment(true);
      try {
        if (userId) {
          const isUserEnrolled =
            Array.isArray(initialCourse.enrollments) &&
            initialCourse.enrollments.some(
              (enrollment: Enrollment) => enrollment.userId === userId
            );
          setIsEnrolled(isUserEnrolled);
          const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
          const subscriptionEndDate = user?.publicMetadata
            ?.subscriptionEndDate as string | null;
          const isSubscriptionActive =
            subscriptionStatus === 'active' &&
            (!subscriptionEndDate ||
              new Date(subscriptionEndDate) > new Date());
          setIsSubscriptionActive(isSubscriptionActive);
          if (isUserEnrolled) {
            const lessons = await getLessonsByCourseId(
              initialCourse.id,
              userId
            );
            if (lessons) {
              const normalizedLessons = lessons.map((lesson) => ({
                ...lesson,
                isLocked: lesson.isLocked,
                porcentajecompletado: lesson.userProgress,
                isNew: lesson.isNew,
              }));
              setCourse((prev) => ({
                ...prev,
                lessons: sortLessons(normalizedLessons),
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
      } finally {
        setIsCheckingEnrollment(false);
        setIsLoading(false);
      }
    };
    void checkEnrollmentAndProgress();
  }, [userId, user, initialCourse.id, initialCourse.enrollments]);

  // Abrir modal de pago si viene ?comprar=1 en la URL (flujo legacy)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('comprar') === '1') {
      setShowPaymentModal(true);
      url.searchParams.delete('comprar');
      const newUrl = `${url.pathname}${
        url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''
      }`;
      router.replace(newUrl);
    }
  }, [router]);
  const continueLessonId = useMemo(() => {
    if (!Array.isArray(course.lessons) || course.lessons.length === 0) {
      return null;
    }

    const sortedLessons = sortLessons(
      course.lessons as Array<
        Course['lessons'][number] & {
          isLocked?: boolean | null;
          porcentajecompletado?: number | null;
        }
      >
    );

    const unlockedLessons = sortedLessons.filter((lesson) => !lesson.isLocked);

    for (let i = unlockedLessons.length - 1; i >= 0; i -= 1) {
      const lesson = unlockedLessons[i];
      const progress = lesson.porcentajecompletado ?? 0;
      if (progress < 100) {
        return lesson.id;
      }
    }

    if (unlockedLessons.length > 0) {
      return unlockedLessons[unlockedLessons.length - 1]?.id ?? null;
    }

    return sortedLessons[0]?.id ?? null;
  }, [course.lessons]);

  const handleContinueCourse = () => {
    if (continueLessonId) {
      router.push(`/estudiantes/clases/${continueLessonId}`);
      return;
    }
    router.push('/estudiantes');
  };

  const handleUnenrollDialogChange = (open: boolean) => {
    if (!open && isUnenrolling) return;
    setShowUnenrollDialog(open);
  };

  const handleConfirmUnenroll = async () => {
    if (!course?.id) return;
    setIsUnenrolling(true);
    try {
      const result = await unenrollFromCourse(Number(course.id));
      if (!result.success) {
        toast.error('No pudimos desuscribirte', {
          description: result.message,
        });
        return;
      }

      toast.success('Te has desuscrito del curso.');
      setIsEnrolled(false);
      setShowUnenrollDialog(false);
      setTotalStudents((prev) => {
        const value = typeof prev === 'number' ? prev : 0;
        return value > 0 ? value - 1 : 0;
      });
    } catch (error) {
      console.error('Error unenrolling user:', error);
      toast.error('Ocurrió un error al desuscribirte. Intenta nuevamente.');
    } finally {
      setIsUnenrolling(false);
    }
  };

  const renderAccessGuard = (section: NavKey) => {
    const label = sectionLabels[section] ?? 'esta sección';
    const requiresLogin = !isSignedIn;

    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#22C4D3] bg-[#061c37] p-6 text-center">
        <h3 className="text-xl font-semibold text-white">Acceso restringido</h3>
        <p className="text-sm text-[#94A3B8]">
          {requiresLogin
            ? `Inicia sesión e inscríbete para acceder a ${label}.`
            : `Inscríbete en el curso para ver ${label}.`}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          {requiresLogin && (
            <button
              type="button"
              onClick={() => {
                setPendingOpenPayment(false);
                setShowLoginModal(true);
              }}
              className="ring-offset-background focus-visible:ring-ring inline-flex h-11 items-center justify-center rounded-full bg-[#0b2747] px-5 text-sm font-semibold text-white transition hover:bg-[#11335c] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Iniciar sesión
            </button>
          )}
          <button
            type="button"
            onClick={handleStartNow}
            className="ring-offset-background focus-visible:ring-ring inline-flex h-11 items-center justify-center rounded-full bg-[#22c4d3] px-5 text-sm font-semibold text-[#080c16] transition hover:bg-[#1fb0be] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Inscribirme
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <CourseDetailsSkeleton />;
  }

  const s3Base = process.env.NEXT_PUBLIC_AWS_S3_URL?.replace(/\/$/, '') ?? '';
  const coverImageUrl = course.coverImageKey
    ? `${s3Base}/${String(course.coverImageKey).replace(/^\/+/, '')}`
    : undefined;
  const coverVideoUrl = course.coverVideoCourseKey
    ? `${s3Base}/${String(course.coverVideoCourseKey).replace(/^\/+/, '')}`
    : undefined;

  // --- NUEVO LAYOUT VISUAL ---
  return (
    <>
      <div className="bg-background min-h-screen">
        <main className="mx-auto -mt-6 max-w-7xl px-4 py-2 sm:-mt-0 md:px-6 md:py-8 lg:px-8">
          <CourseBreadcrumb title={course.title} programInfo={programInfo} />
          <div
            className="relative rounded-2xl border p-2 shadow-xl shadow-black/20 backdrop-blur-sm md:p-8"
            style={{
              backgroundColor: '#010b17',
              borderColor: '#061c37cc',
              backgroundImage: coverImageUrl
                ? `url(${coverImageUrl})`
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
            }}
          >
            <div className="from-background via-background/95 to-background/80 absolute inset-0 rounded-2xl bg-gradient-to-r"></div>
            <div className="relative z-10 space-y-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Mini tarjeta estática para móviles: mismo contenido y estilo que el CTA lateral de escritorio */}
                <div className="lg:hidden">
                  <div
                    className="border-border relative overflow-hidden rounded-2xl border bg-[#061c37]"
                    style={{ borderColor: '#1d283a', borderWidth: '1px' }}
                  >
                    <div className="relative">
                      <AspectRatio ratio={16 / 9}>
                        <div className="relative h-full w-full overflow-hidden">
                          {coverVideoUrl ? (
                            <video
                              className="h-full w-full object-cover"
                              src={coverVideoUrl}
                              poster={coverImageUrl}
                              controls
                            />
                          ) : (
                            <>
                              {coverImageUrl && (
                                <Image
                                  src={coverImageUrl}
                                  alt={course.title}
                                  fill
                                  className="object-cover"
                                  sizes="100vw"
                                  quality={85}
                                  priority={false}
                                />
                              )}
                              <div
                                className="pointer-events-none absolute inset-0 z-10"
                                style={{
                                  background:
                                    'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(6, 28, 55, 0.1) 35%, rgba(6, 28, 55, 0.3) 50%, rgba(6, 28, 55, 0.6) 65%, rgba(6, 28, 55, 0.85) 80%, rgba(6, 28, 55, 0.95) 90%, #061c37 100%)',
                                  willChange: 'transform',
                                }}
                              />
                            </>
                          )}
                        </div>
                      </AspectRatio>
                    </div>
                    <div className="relative z-20 space-y-5 p-5">
                      {courseTypes.length > 0 &&
                        (() => {
                          const primaryType = courseTypes[0];
                          if (!primaryType) return null;

                          const isPremium =
                            primaryType.requiredSubscriptionLevel === 'premium';
                          const isPro =
                            primaryType.requiredSubscriptionLevel === 'pro';
                          const isFree =
                            primaryType.requiredSubscriptionLevel === 'none' &&
                            !primaryType.isPurchasableIndividually;
                          const label = isPremium
                            ? 'Premium'
                            : isPro
                              ? 'Pro'
                              : isFree
                                ? 'Gratis'
                                : 'Compra única';
                          const styleMap: Record<
                            string,
                            { bg: string; border: string; text: string }
                          > = {
                            Premium: {
                              bg: 'rgba(251, 191, 36, 0.15)',
                              border: '#f59e0b',
                              text: '#fef3c7',
                            },
                            Pro: {
                              bg: 'rgba(59, 130, 246, 0.15)',
                              border: '#60a5fa',
                              text: '#dbeafe',
                            },
                            Gratis: {
                              bg: 'rgba(34, 197, 94, 0.18)',
                              border: '#22c55e',
                              text: '#16a34a',
                            },
                            'Compra única': {
                              bg: 'rgba(37, 99, 235, 0.15)',
                              border: '#60a5fa',
                              text: '#dbeafe',
                            },
                          };

                          if (label === 'Pro') return null;
                          if (label === 'Premium') return null;
                          if (label === 'Compra única') return null;

                          const styles =
                            styleMap[label] ?? styleMap['Compra única'];
                          return (
                            <div className="flex flex-wrap gap-2">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
                                style={{
                                  backgroundColor: styles.bg,
                                  borderColor: styles.border,
                                  color: styles.text,
                                }}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })()}
                      {includedPlans.length > 0 && (
                        <div className="space-y-1">
                          {includedPlans.includes('Premium') &&
                          includedPlans.includes('Pro') ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-400 bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400">
                              <AiFillFire className="h-4 w-4 text-red-400" />
                              <span>Premium + Pro</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              {includedPlans.includes('Premium') && (
                                <div className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-400">
                                  <FaCrown className="h-3 w-3" />
                                  <span>Premium</span>
                                </div>
                              )}
                              {includedPlans.includes('Pro') && (
                                <div className="inline-flex items-center gap-1 rounded-full border border-blue-400 bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-400">
                                  <FaStar className="h-3 w-3" />
                                  <span>Pro</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {(_hasPurchasable || course.individualPrice) && (
                        <div className="space-y-1">
                          <p className="text-foreground text-2xl font-bold">
                            ${' '}
                            {formatPrice(
                              course.individualPrice ?? course.courseType?.price
                            )}
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            Precio individual del curso
                          </p>
                        </div>
                      )}
                      <div className="space-y-3">
                        {includedPlans.length > 0 && (
                          <div>
                            <p className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[#22C4D3]">
                              {includedPlans.includes('Premium') &&
                              includedPlans.includes('Pro')
                                ? 'Incluido en tu plan Premium y Pro'
                                : userIncludedPlanLabel
                                  ? `Incluido en tu plan ${userIncludedPlanLabel.toUpperCase()}`
                                  : `Incluido en ${
                                      includedPlans.length > 1
                                        ? 'los planes'
                                        : 'el plan'
                                    } ${includedPlans.join(' + ')}`}
                              {includedPlans.includes('Pro') &&
                              !includedPlans.includes('Premium') ? (
                                <FaStar className="h-4 w-4 text-blue-400" />
                              ) : includedPlans.includes('Premium') &&
                                !includedPlans.includes('Pro') ? (
                                <FaCrown className="h-4 w-4 text-amber-400" />
                              ) : (
                                <AiFillFire className="h-4 w-4 text-red-400" />
                              )}
                            </p>
                          </div>
                        )}
                        {isEnrolled ? (
                          <div className="space-y-2">
                            <div className="group relative">
                              <button
                                type="button"
                                className="ring-offset-background focus-visible:ring-ring group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#10b9814d] bg-emerald-500/20 px-4 py-2 text-base font-semibold whitespace-nowrap text-emerald-400 transition-all hover:bg-[#10b9814d] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                              >
                                <FaCheck
                                  className="mr-2 h-5 w-5"
                                  style={{ color: 'rgb(52 211 153)' }}
                                />
                                Suscrito
                              </button>
                              <button
                                type="button"
                                aria-label="Cancelar suscripción al curso"
                                onClick={() => setShowUnenrollDialog(true)}
                                disabled={isUnenrolling}
                                className="hover:bg-destructive/20 group absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                              >
                                <FaTimes className="h-4 w-4 text-emerald-400 transition-colors group-hover:text-red-500" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleContinueCourse}
                              disabled={!continueLessonId}
                              className="ring-offset-background focus-visible:ring-ring hover:bg-primary/90 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#22c4d3] px-4 py-2 text-sm font-medium text-[#080c16] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0"
                            >
                              <IoPlayOutline className="mr-2 text-black" />
                              Continuar curso
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={handleStartNow}
                              disabled={isEnrolling}
                              className="ring-offset-background focus-visible:ring-ring hover:shadow-primary/20 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-semibold whitespace-nowrap transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                              style={{
                                color: '#080C16',
                                backgroundColor: '#22c4d3e6',
                              }}
                            >
                              {isEnrolling ? 'Inscribiendo…' : 'Empezar Ahora'}
                            </button>
                            <p className="text-center text-xs text-[#94A3B8]">
                              Accede a este y a más de{' '}
                              <span className="font-medium text-white">
                                {totalSimilarCourses}{' '}
                                {totalSimilarCourses === 1 ? 'curso' : 'cursos'}
                              </span>{' '}
                              con {planPhrase}.{' '}
                              <a
                                href="/planes"
                                className="text-white hover:underline"
                              >
                                Ver planes
                              </a>
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-8 lg:col-span-2">
                  <div className="space-y-6">
                    {/* Categoria encima del título */}
                    {course.category?.name && (
                      <div
                        className="mb-1 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
                        style={{
                          backgroundColor: '#22c4d31a',
                          borderColor: '#22C4D333',
                        }}
                      >
                        <span
                          className="text-xs font-medium"
                          style={{ color: '#22C4D3' }}
                        >
                          {course.category.name}
                        </span>
                      </div>
                    )}
                    <h1 className="font-display text-foreground text-3xl leading-tight font-bold md:text-4xl lg:text-5xl">
                      {course.title}
                    </h1>

                    {/* Nivel y modalidad mostrado más abajo junto al horario */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-amber-400">
                          {course.rating ?? '4.8'}
                        </span>
                        <div className="flex">
                          {/* Estrellas fijas para ejemplo visual */}
                          {[...Array(4)].map((_, i) => (
                            <svg
                              key={i}
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-star h-4 w-4 fill-amber-400 text-amber-400"
                            >
                              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                            </svg>
                          ))}
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
                            className="lucide lucide-star h-4 w-4 fill-amber-400/50 text-amber-400"
                          >
                            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                          </svg>
                        </div>
                        <span className="text-[#94A3B8]">
                          ({commentsCount ?? 0} opiniones)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#94A3B8]">
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
                          className="lucide lucide-users h-4 w-4"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>{totalStudents ?? 0} estudiantes</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="border-primary/40 text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
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
                          className="lucide lucide-book-open text-primary h-3.5 w-3.5"
                        >
                          <path d="M12 7v14"></path>
                          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                        </svg>
                        {course.lessons?.length ?? 0} clases
                      </span>
                      <span className="border-primary/40 text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
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
                          className="lucide lucide-clock text-primary h-3.5 w-3.5"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        40h contenido
                      </span>
                    </div>
                    {/* Nivel y modalidad: mostrar abajo del horario */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        style={{ backgroundColor: '#1A2333' }}
                        className="text-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="M12 7v10"></path>
                          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                        </svg>
                        {course.nivel
                          ? typeof course.nivel === 'string'
                            ? course.nivel
                            : course.nivel?.name || 'Intermedio'
                          : 'Intermedio'}
                      </span>
                      {course.modalidad && (
                        <span
                          style={{ backgroundColor: '#1A2333' }}
                          className="text-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                        >
                          <MdOutlineVideocam className="h-3 w-3" />
                          {typeof course.modalidad === 'string'
                            ? course.modalidad
                            : course.modalidad.name}
                        </span>
                      )}
                      {/* Badge de horario al lado derecho de modalidad (solo si existe) */}
                      {course.horario && (
                        <span
                          style={{ backgroundColor: '#1A2333' }}
                          className="text-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                        >
                          <AiOutlineCalendar className="h-3 w-3" />
                          {course.horario}
                        </span>
                      )}
                    </div>
                    <p className="max-w-2xl text-lg text-[#94A3B8]">
                      {course.description}
                    </p>

                    {/* Carousel de botones/resumen (debajo de la descripción) */}
                    <div className="mt-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => scrollCarousel('left')}
                          className="inline-flex aspect-square h-9 w-9 items-center justify-center rounded-full border border-[#061c3799] bg-[#011329] p-0 text-white transition hover:bg-[#0b2747] hover:text-white"
                          aria-label="Anterior"
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
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>
                        <div
                          ref={carouselRef}
                          className="relative flex w-full gap-2 overflow-x-auto px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] md:px-3 [&::-webkit-scrollbar]:hidden"
                          style={{ scrollSnapType: 'x mandatory' }}
                        >
                          {navItems.map((item) => {
                            const isActive = activePill === item.key;
                            const badgeCount = badgeCounts[item.key] ?? 0;
                            const showBadge =
                              badgeCount > 0 && !seenSections[item.key];
                            return (
                              <button
                                key={item.key}
                                onClick={() => handlePillClick(item.key)}
                                className={`flex shrink-0 items-center gap-2 rounded-full border px-[20px] py-[10px] text-sm font-semibold transition-all ${
                                  isActive
                                    ? 'border-[hsl(217,33%,17%)] bg-[#061c37] text-white'
                                    : 'border-transparent bg-transparent text-white/80 hover:border-[hsl(217,33%,17%)]/60 hover:bg-[#061c3780]/50 hover:text-white'
                                }`}
                                style={{ scrollSnapAlign: 'start' }}
                              >
                                <span>{item.label}</span>
                                {showBadge && (
                                  <span className="inline-flex aspect-square h-6 w-6 justify-center rounded-full border border-white/20 bg-[#22C4D3] pt-[2.5px] text-xs text-black">
                                    {badgeCount}
                                  </span>
                                )}
                                {item.helper && (
                                  <span className="hidden text-xs font-normal text-white/60 sm:inline">
                                    {item.helper}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => scrollCarousel('right')}
                          className="inline-flex aspect-square h-9 w-9 items-center justify-center rounded-full border border-[#061c3799] bg-[#011329] p-0 text-white transition hover:bg-[#0b2747] hover:text-white"
                          aria-label="Siguiente"
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
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mostrar el listado de clases controlado por los botones */}
                    <div className="mt-6">
                      {activePill === 'proyectos' ? (
                        isEnrolled ? (
                          <ProjectsSection
                            courseId={course.id}
                            isEnrolled={isEnrolled}
                            isSubscriptionActive={isSubscriptionActive}
                            onProjectsChange={() => {
                              // Recargar conteo de proyectos
                              void fetch(
                                `/api/estudiantes/projects?courseId=${course.id}`
                              )
                                .then((res) => res.json())
                                .then((data) =>
                                  setProjectsCount(
                                    Array.isArray(data) ? data.length : 0
                                  )
                                );
                            }}
                          />
                        ) : (
                          renderAccessGuard('proyectos')
                        )
                      ) : activePill === 'recursos' ? (
                        isEnrolled ? (
                          <ResourcesSection courseId={course.id} />
                        ) : (
                          renderAccessGuard('recursos')
                        )
                      ) : activePill === 'actividades' ? (
                        isEnrolled ? (
                          <CourseActivities
                            lessons={lessonsWithActivities}
                            isEnrolled={isEnrolled}
                          />
                        ) : (
                          renderAccessGuard('actividades')
                        )
                      ) : activePill === 'grabadas' ? (
                        isEnrolled ? (
                          <CourseContent
                            course={course}
                            isEnrolled={isEnrolled}
                            isSubscriptionActive={isSubscriptionActive}
                            subscriptionEndDate={subscriptionEndDate}
                            isSignedIn={!!isSignedIn}
                            classMeetings={classMeetings}
                            viewMode={viewMode}
                          />
                        ) : (
                          renderAccessGuard('grabadas')
                        )
                      ) : activePill === 'foro' ? (
                        isEnrolled ? (
                          <CourseForum courseId={course.id} />
                        ) : (
                          renderAccessGuard('foro')
                        )
                      ) : (
                        <CourseContent
                          course={course}
                          isEnrolled={isEnrolled}
                          isSubscriptionActive={isSubscriptionActive}
                          subscriptionEndDate={subscriptionEndDate}
                          isSignedIn={!!isSignedIn}
                          classMeetings={classMeetings}
                          viewMode={viewMode}
                        />
                      )}
                    </div>

                    {/* Sección de comentarios - Solo en la vista de curso */}
                    {activePill === 'curso' && (
                      <div className="mt-8">
                        <CourseComments
                          courseId={course.id}
                          isEnrolled={isEnrolled}
                          onEnrollmentChange={(enrolled) =>
                            setIsEnrolled(enrolled)
                          }
                          onCommentsCountChange={(n) => setCommentsCount(n)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {/* LADO DERECHO: Imagen y CTA */}
                <div className="sticky top-24 hidden max-h-[calc(100vh-8rem)] self-start lg:block">
                  <div
                    className="border-border relative overflow-hidden rounded-2xl border bg-[#061c37]"
                    style={{ borderColor: '#1d283a', borderWidth: '1px' }}
                  >
                    <div className="relative">
                      <AspectRatio ratio={16 / 9}>
                        <div className="relative h-full w-full overflow-hidden">
                          {coverVideoUrl ? (
                            <video
                              className="h-full w-full object-cover"
                              src={coverVideoUrl}
                              poster={coverImageUrl}
                              controls
                            />
                          ) : (
                            <>
                              {course.coverImageKey && (
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                                  alt={course.title}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 1023px) 0px, 33vw"
                                  quality={85}
                                  loading="eager"
                                  priority={false}
                                />
                              )}
                              <div
                                className="pointer-events-none absolute inset-0 z-10"
                                style={{
                                  background:
                                    'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(6, 28, 55, 0.1) 35%, rgba(6, 28, 55, 0.3) 50%, rgba(6, 28, 55, 0.6) 65%, rgba(6, 28, 55, 0.85) 80%, rgba(6, 28, 55, 0.95) 90%, #061c37 100%)',
                                  willChange: 'transform',
                                }}
                              />
                            </>
                          )}
                        </div>
                      </AspectRatio>
                    </div>
                    <div className="relative z-20 space-y-5 p-5">
                      {courseTypes.length > 0 &&
                        (() => {
                          const primaryType = courseTypes[0];
                          if (!primaryType) return null;

                          const isPremium =
                            primaryType.requiredSubscriptionLevel === 'premium';
                          const isPro =
                            primaryType.requiredSubscriptionLevel === 'pro';
                          const isFree =
                            primaryType.requiredSubscriptionLevel === 'none' &&
                            !primaryType.isPurchasableIndividually;
                          const label = isPremium
                            ? 'Premium'
                            : isPro
                              ? 'Pro'
                              : isFree
                                ? 'Gratis'
                                : 'Compra única';
                          const styleMap: Record<
                            string,
                            { bg: string; border: string; text: string }
                          > = {
                            Premium: {
                              bg: 'rgba(251, 191, 36, 0.15)',
                              border: '#f59e0b',
                              text: '#fef3c7',
                            },
                            Pro: {
                              bg: 'rgba(59, 130, 246, 0.15)',
                              border: '#60a5fa',
                              text: '#dbeafe',
                            },
                            Gratis: {
                              bg: 'rgba(34, 197, 94, 0.18)',
                              border: '#22c55e',
                              text: '#16a34a',
                            },
                            'Compra única': {
                              bg: 'rgba(37, 99, 235, 0.15)',
                              border: '#60a5fa',
                              text: '#dbeafe',
                            },
                          };

                          if (label === 'Pro') return null; // Evita el badge duplicado; se muestra solo el de estrella
                          if (label === 'Premium') return null; // Evita duplicar con el badge inferior de planes incluidos
                          if (label === 'Compra única') return null; // No mostrar el badge de compra individual aquí

                          const styles =
                            styleMap[label] ?? styleMap['Compra única'];
                          return (
                            <div className="flex flex-wrap gap-2">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
                                style={{
                                  backgroundColor: styles.bg,
                                  borderColor: styles.border,
                                  color: styles.text,
                                }}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })()}
                      {includedPlans.length > 0 && (
                        <div className="space-y-1">
                          {includedPlans.includes('Premium') &&
                          includedPlans.includes('Pro') ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-400 bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400">
                              <AiFillFire className="h-4 w-4 text-red-400" />
                              <span>Premium + Pro</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              {includedPlans.includes('Premium') && (
                                <div className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-400">
                                  <FaCrown className="h-3 w-3" />
                                  <span>Premium</span>
                                </div>
                              )}
                              {includedPlans.includes('Pro') && (
                                <div className="inline-flex items-center gap-1 rounded-full border border-blue-400 bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-400">
                                  <FaStar className="h-3 w-3" />
                                  <span>Pro</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {(_hasPurchasable || course.individualPrice) && (
                        <div className="space-y-1">
                          <p className="text-foreground text-2xl font-bold">
                            ${' '}
                            {formatPrice(
                              course.individualPrice ?? course.courseType?.price
                            )}
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            Precio individual del curso
                          </p>
                        </div>
                      )}
                      <div className="space-y-3">
                        {includedPlans.length > 0 && (
                          <div>
                            <p className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[#22C4D3]">
                              {includedPlans.includes('Premium') &&
                              includedPlans.includes('Pro')
                                ? 'Incluido en tu plan Premium y Pro'
                                : userIncludedPlanLabel
                                  ? `Incluido en tu plan ${userIncludedPlanLabel.toUpperCase()}`
                                  : `Incluido en ${
                                      includedPlans.length > 1
                                        ? 'los planes'
                                        : 'el plan'
                                    } ${includedPlans.join(' + ')}`}
                              {includedPlans.includes('Pro') &&
                              !includedPlans.includes('Premium') ? (
                                <FaStar className="h-4 w-4 text-blue-400" />
                              ) : includedPlans.includes('Premium') &&
                                !includedPlans.includes('Pro') ? (
                                <FaCrown className="h-4 w-4 text-amber-400" />
                              ) : (
                                <AiFillFire className="h-4 w-4 text-red-400" />
                              )}
                            </p>
                          </div>
                        )}
                        {isEnrolled ? (
                          <div className="space-y-2">
                            <div className="group relative">
                              <button
                                type="button"
                                className="ring-offset-background focus-visible:ring-ring group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#10b9814d] bg-emerald-500/20 px-4 py-2 text-base font-semibold whitespace-nowrap text-emerald-400 transition-all hover:bg-[#10b9814d] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                              >
                                <FaCheck
                                  className="mr-2 h-5 w-5"
                                  style={{ color: 'rgb(52 211 153)' }}
                                />
                                Suscrito
                              </button>
                              <button
                                type="button"
                                aria-label="Cancelar suscripción al curso"
                                onClick={() => setShowUnenrollDialog(true)}
                                disabled={isUnenrolling}
                                className="hover:bg-destructive/20 group absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                              >
                                <FaTimes className="h-4 w-4 text-emerald-400 transition-colors group-hover:text-red-500" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleContinueCourse}
                              disabled={!continueLessonId}
                              className="ring-offset-background focus-visible:ring-ring hover:bg-primary/90 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#22c4d3] px-4 py-2 text-sm font-medium text-[#080c16] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0"
                            >
                              <IoPlayOutline className="mr-2 text-black" />
                              Continuar curso
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={handleStartNow}
                              disabled={isEnrolling}
                              className="ring-offset-background focus-visible:ring-ring hover:shadow-primary/20 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-semibold whitespace-nowrap transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                              style={{
                                color: '#080C16',
                                backgroundColor: '#22c4d3e6',
                              }}
                            >
                              {isEnrolling ? 'Inscribiendo…' : 'Empezar Ahora'}
                            </button>
                            <p className="text-center text-xs text-[#94A3B8]">
                              Accede a este y a más de{' '}
                              <span className="font-medium text-white">
                                {totalSimilarCourses}{' '}
                                {totalSimilarCourses === 1 ? 'curso' : 'cursos'}
                              </span>{' '}
                              con {planPhrase}.{' '}
                              <a
                                href="/planes"
                                className="text-white hover:underline"
                              >
                                Ver planes
                              </a>
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showPaymentModal && courseProduct && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-3 right-3 rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <FaTimes className="h-5 w-5" />
            </button>
            <div className="space-y-3 pt-2 text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Completa tu compra
              </h3>
              <p className="text-sm text-gray-600">
                Curso:{' '}
                <span className="font-semibold">
                  {courseProduct.description}
                </span>
              </p>
            </div>
            <div className="mt-4">
              <PaymentForm
                selectedProduct={courseProduct}
                requireAuthOnSubmit={!isSignedIn}
                redirectUrlOnAuth={`/estudiantes/cursos/${course.id}`}
              />
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <MiniLoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setPendingOpenPayment(false);
          }}
          onLoginSuccess={handleLoginSuccess}
          redirectUrl={`/estudiantes/cursos/${course.id}`}
        />
      )}

      <Dialog
        open={showUnenrollDialog}
        onOpenChange={handleUnenrollDialogChange}
      >
        <DialogContent className="border border-[#1D283A] bg-[#061c37] sm:rounded-[16px]">
          <DialogHeader className="space-y-2 text-center sm:text-left">
            <DialogTitle className="text-[#f8fafc]">¿Estás seguro?</DialogTitle>
            <DialogDescription className="text-[#94a3b8]">
              ¿Estás seguro que quieres cancelar tu suscripción al curso?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
            <button
              type="button"
              onClick={() => setShowUnenrollDialog(false)}
              disabled={isUnenrolling}
              className="hover:text-accent-foreground focus-visible:ring-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#1D283A] bg-[#01152d] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#22C4D3] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmUnenroll}
              disabled={isUnenrolling}
              className="focus-visible:ring-ring inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#7c1d1d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#991b1b] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              {isUnenrolling ? 'Procesando…' : 'Aceptar'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
