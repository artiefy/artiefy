'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import { AiFillFire, AiOutlineCalendar } from 'react-icons/ai';
import {
  FaCheck,
  FaCheckCircle,
  FaCrown,
  FaLock,
  FaStar,
  FaTimes,
} from 'react-icons/fa';
import { FaBuildingUser, FaChalkboardUser, FaUserClock } from 'react-icons/fa6';
import { IoPlayOutline } from 'react-icons/io5';
import { MdOutlineVideocam } from 'react-icons/md';
import { RiEqualizer2Line } from 'react-icons/ri';
import { toast } from 'sonner';

import { CourseActivities } from '~/components/estudiantes/layout/coursedetail/CourseActivities';
import { CourseBreadcrumb } from '~/components/estudiantes/layout/coursedetail/CourseBreadcrumb';
import CourseComments from '~/components/estudiantes/layout/coursedetail/CourseComments';
import { CourseContent } from '~/components/estudiantes/layout/coursedetail/CourseContent';
import { CourseDetailsSkeleton } from '~/components/estudiantes/layout/coursedetail/CourseDetailsSkeleton';
import { CourseForum } from '~/components/estudiantes/layout/coursedetail/CourseForum';
import { ProjectsSection } from '~/components/estudiantes/layout/coursedetail/ProjectsSection';
import { ResourcesSection } from '~/components/estudiantes/layout/coursedetail/ResourcesSection';
import { LessonGradeHistoryInline } from '~/components/estudiantes/layout/lessondetail/LessonGradeHistoryInline';
import MiniLoginModal from '~/components/estudiantes/layout/MiniLoginModal';
import MiniSignUpModal from '~/components/estudiantes/layout/MiniSignUpModal';
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

import type { ClassMeeting, Course, Enrollment, Lesson } from '~/types';

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
  | 'certificacion'
  | 'resultados'
  | 'foro';

type CourseGradeSummary = {
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
};

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
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [pendingOpenPayment, setPendingOpenPayment] = useState(false);
  const [seenSections, setSeenSections] = useState<Record<NavKey, boolean>>({
    curso: true,
    grabadas: false,
    proyectos: false,
    recursos: false,
    actividades: false,
    certificacion: false,
    resultados: false,
    foro: false,
  });
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [gradeSummary, setGradeSummary] = useState<CourseGradeSummary | null>(
    null
  );
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
  const getModalidadIcon = (modalidadName?: string) => {
    if (!modalidadName) return <MdOutlineVideocam className="h-3 w-3" />;
    const name = modalidadName.toLowerCase();
    if (name.includes('presencial'))
      return <FaBuildingUser className="h-3 w-3" />;
    if (
      name.includes('virtual') ||
      name.includes('sincron') ||
      name.includes('sincrónica') ||
      name.includes('sincronica')
    )
      return <FaChalkboardUser className="h-3 w-3" />;
    if (
      name.includes('combin') ||
      name.includes('hibr') ||
      name.includes('artiefy')
    )
      return <FaUserClock className="h-3 w-3" />;
    return <FaUserClock className="h-3 w-3" />;
  };

  const recordedCount = Array.isArray(classMeetings)
    ? classMeetings.filter((m) => !!m.video_key).length
    : 0;
  const _liveClassesCount = Array.isArray(classMeetings)
    ? classMeetings.filter((m) => !m.video_key).length
    : 0;
  const resourcesCount = Array.isArray(course.lessons)
    ? course.lessons.filter((l) => l.resourceKey && l.resourceKey.trim() !== '')
        .length
    : 0;
  const courseProgressPercent = useMemo(() => {
    const lessons = course.lessons ?? [];
    if (lessons.length === 0) return 0;

    const isLessonCompleted = (lesson: Lesson) => {
      const hasVideo =
        !!lesson.coverVideoKey && lesson.coverVideoKey !== 'none';
      const activities = lesson.activities ?? [];
      const hasActivities = activities.length > 0;
      const activitiesCompleted = hasActivities
        ? activities.every(
            (activity) =>
              activity.isCompleted || (activity.userProgress ?? 0) >= 100
          )
        : false;
      const videoCompleted = (lesson.porcentajecompletado ?? 0) >= 100;

      if (hasVideo && hasActivities)
        return videoCompleted && activitiesCompleted;
      if (hasVideo) return videoCompleted;
      if (hasActivities) return activitiesCompleted;

      return lesson.isCompleted ?? false;
    };

    const completedLessons = lessons.filter((lesson) =>
      isLessonCompleted(lesson as Lesson)
    ).length;

    return Math.round((completedLessons / lessons.length) * 100);
  }, [course.lessons]);

  const isCertificateUnlocked = courseProgressPercent >= 100;
  const totalLessons = useMemo(
    () => course.lessons?.length ?? 0,
    [course.lessons]
  );
  const completedLessonsCount = useMemo(() => {
    const lessons = course.lessons ?? [];
    return lessons.filter((lesson) => {
      const hasVideo =
        !!lesson.coverVideoKey && lesson.coverVideoKey !== 'none';
      const activities = lesson.activities ?? [];
      const hasActivities = activities.length > 0;
      const activitiesCompleted = hasActivities
        ? activities.every(
            (activity: { isCompleted?: boolean; userProgress?: number }) =>
              activity.isCompleted || (activity.userProgress ?? 0) >= 100
          )
        : false;
      const videoCompleted = (lesson.porcentajecompletado ?? 0) >= 100;

      if (hasVideo && hasActivities)
        return videoCompleted && activitiesCompleted;
      if (hasVideo) return videoCompleted;
      if (hasActivities) return activitiesCompleted;

      return lesson.isCompleted ?? false;
    }).length;
  }, [course.lessons]);
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
      curso: totalLessons,
      grabadas: recordedCount,
      proyectos: projectsCount,
      recursos: resourcesCount,
      actividades: activitiesStats.total,
      certificacion: 0,
      resultados: 0,
      foro: 0,
    }),
    [
      totalLessons,
      activitiesStats.total,
      projectsCount,
      recordedCount,
      resourcesCount,
    ]
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
          certificacion: unseenCounts.certificacion,
          resultados: unseenCounts.resultados,
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
        certificacion: 0,
        resultados: 0,
        foro: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, userId]);

  // Calcula cuántos items nuevos hay desde la última vez que el usuario vio cada sección
  const badgeCounts = useMemo<Record<NavKey, number>>(() => {
    if (!isEnrolled || !lastSeenCounts) {
      // Si no está inscrito o no hay conteos previos, no mostrar badges
      return {
        curso: 0,
        grabadas: 0,
        proyectos: 0,
        recursos: 0,
        actividades: 0,
        certificacion: 0,
        resultados: 0,
        foro: 0,
      };
    }

    // Calcular la diferencia entre el conteo actual y el último visto
    const result: Record<NavKey, number> = {
      curso: Math.max(0, unseenCounts.curso - lastSeenCounts.curso),
      grabadas: Math.max(0, unseenCounts.grabadas - lastSeenCounts.grabadas),
      proyectos: Math.max(0, unseenCounts.proyectos - lastSeenCounts.proyectos),
      recursos: Math.max(0, unseenCounts.recursos - lastSeenCounts.recursos),
      actividades: Math.max(
        0,
        unseenCounts.actividades - lastSeenCounts.actividades
      ),
      certificacion: Math.max(
        0,
        unseenCounts.certificacion - lastSeenCounts.certificacion
      ),
      resultados: Math.max(
        0,
        unseenCounts.resultados - lastSeenCounts.resultados
      ),
      foro: Math.max(0, unseenCounts.foro - lastSeenCounts.foro),
    };

    return result;
  }, [unseenCounts, lastSeenCounts, isEnrolled]);
  const navItems: Array<{ key: NavKey; label: string; helper?: string }> = [
    {
      key: 'curso',
      label: 'Curso',
      helper: undefined,
    },
    {
      key: 'certificacion',
      label: 'Certificación',
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
    {
      key: 'resultados',
      label: 'Resultados',
      helper: undefined,
    },
    { key: 'foro', label: 'Foro', helper: undefined },
  ];

  const sectionLabels: Record<NavKey, string> = {
    curso: 'el contenido del curso',
    certificacion: 'la certificación',
    grabadas: 'las clases grabadas',
    proyectos: 'los proyectos',
    recursos: 'los recursos',
    actividades: 'las actividades',
    resultados: 'los resultados',
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
          certificacion: 0,
          resultados: 0,
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

  const handleCertificateClick = () => {
    if (courseProgressPercent < 100) {
      toast.info('Completa el 100% del curso para descargar tu certificado.');
      return;
    }

    const certificateUrl = `/estudiantes/certificados/${course.id}`;
    window.open(certificateUrl, '_blank', 'noopener,noreferrer');
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

  // Cargar resumen de calificaciones para la sección de resultados
  useEffect(() => {
    const fetchGradeSummary = async () => {
      if (isSignedIn && userId && course.id) {
        try {
          const response = await fetch(
            `/api/grades/summary?courseId=${course.id}&userId=${userId}`
          );
          if (response.ok) {
            const data = await response.json();
            setGradeSummary(data);
          }
        } catch (error) {
          console.error('Error al obtener resumen de calificaciones:', error);
        }
      }
    };

    void fetchGradeSummary();
  }, [isSignedIn, userId, course.id]);

  // NOTA: Ya no usamos este useEffect porque abrimos el modal directamente en handleLoginSuccess
  // Esto evita problemas de timing con el cierre automático del modal
  /*
  // Abrir modal de pago después del login si hay pago pendiente
  useEffect(() => {
    if (isSignedIn && pendingOpenPayment) {
      const hasPurchasable = courseTypes.some(
        (t) => t.isPurchasableIndividually
      );
      const isIndividualPurchase =
        hasPurchasable && course.individualPrice && course.individualPrice > 0;

      if (isIndividualPurchase) {
        console.log('✅ Abriendo modal de pago después del login');
        setPendingOpenPayment(false);
        setShowPaymentModal(true);
      }
    }
  }, [isSignedIn, pendingOpenPayment, courseTypes, course.individualPrice]);
  */

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

  const loginRedirectUrl = '';

  const handleLoginSuccess = () => {
    setShowLoginModal(false);

    // Detectar si el curso es purchasable individually
    const hasPurchasable = courseTypes.some((t) => t.isPurchasableIndividually);
    const isIndividualPurchase =
      hasPurchasable && course.individualPrice && course.individualPrice > 0;

    console.log('🔍 handleLoginSuccess - Debug:', {
      pendingOpenPayment,
      hasPurchasable,
      isIndividualPurchase,
      courseId: course.id,
      individualPrice: course.individualPrice,
    });

    // Si hay un pago pendiente Y el curso es de compra individual, abrir modal de pago
    if (pendingOpenPayment && isIndividualPurchase) {
      console.log('✅ Abriendo modal de pago después del login');
      setPendingOpenPayment(false);
      // Usar setTimeout para asegurar que el modal de login se cierre primero
      setTimeout(() => {
        setShowPaymentModal(true);
      }, 100);
      return;
    }

    // Si no hay pago pendiente o no es curso individual, continuar flujo normal
    console.log('ℹ️ Continuando flujo normal de inscripción');
    setPendingOpenPayment(false);
    void handleStartNow();
  };

  // Funciones para cambiar entre modales de login y signup
  const handleSwitchToSignUp = () => {
    setShowLoginModal(false);
    setShowSignUpModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignUpModal(false);
    setShowLoginModal(true);
  };

  // Handler para cuando se completa el signup
  const handleSignUpSuccess = () => {
    console.log('✅ Registro completado, continuando flujo...');
    setShowSignUpModal(false);

    if (pendingOpenPayment) {
      setShowPaymentModal(true);
      setPendingOpenPayment(false);
    } else {
      void handleStartNow();
    }
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

    // Simplificar la lógica: si el curso es purchasable individually, debe pagar
    // a menos que ya tenga acceso por suscripción
    const isIndividualPurchaseRequired =
      hasPurchasable &&
      course.individualPrice &&
      course.individualPrice > 0 &&
      !hasPlanAccess;

    const shouldOpenPayment =
      isIndividualPurchaseRequired ||
      (_hasFree ? false : !hasPlanAccess && !_hasActiveSubscription);

    if (!isSignedIn) {
      // Establecer pendingOpenPayment basado en si el curso requiere pago individual
      setPendingOpenPayment(!!isIndividualPurchaseRequired);
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
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#0b2747] px-5 text-sm font-semibold text-white ring-offset-background transition hover:bg-[#11335c] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Iniciar sesión
            </button>
          )}
          <button
            type="button"
            onClick={handleStartNow}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#22c4d3] px-5 text-sm font-semibold text-[#080c16] ring-offset-background transition hover:bg-[#1fb0be] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
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

  // Función para detectar si una URL es imagen
  const isImageUrl = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
      extension || ''
    );
  };

  // --- NUEVO LAYOUT VISUAL ---
  return (
    <>
      <div className="min-h-screen bg-background">
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
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-background via-background/95 to-background/80"></div>
            <div className="relative z-10 space-y-6">
              {/* 
                Layout adaptativo según inscripción:
                - Inscrito: Mini tarjeta sticky al lado del título, contenido principal a ancho completo debajo del carousel
                - No inscrito: Grid de 3 columnas con mini tarjeta que hace scroll junto al contenido
              */}
              <div
                className={`grid grid-cols-1 gap-8 ${
                  isEnrolled ? 'lg:grid-cols-1' : 'lg:grid-cols-3'
                }`}
              >
                {/* Mini tarjeta estática para móviles: mismo contenido y estilo que el CTA lateral de escritorio */}
                <div className="lg:hidden">
                  <div
                    className="relative overflow-hidden rounded-2xl border border-border bg-[#061c37]"
                    style={{ borderColor: '#1d283a', borderWidth: '1px' }}
                  >
                    <div className="relative">
                      <AspectRatio ratio={16 / 9}>
                        <div className="group relative h-full w-full overflow-hidden">
                          {coverVideoUrl ? (
                            isImageUrl(coverVideoUrl) ? (
                              <Image
                                src={coverVideoUrl}
                                alt={course.title}
                                fill
                                className="object-cover"
                                sizes="100vw"
                                quality={85}
                                priority={false}
                              />
                            ) : (
                              <video
                                className="h-full w-full object-cover"
                                src={coverVideoUrl}
                                poster={coverImageUrl}
                                playsInline
                              />
                            )
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
                            </>
                          )}
                          {(!coverVideoUrl || isImageUrl(coverVideoUrl)) && (
                            <div
                              className="pointer-events-none absolute inset-0 z-20"
                              style={{
                                background:
                                  'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(6, 28, 55, 0.1) 35%, rgba(6, 28, 55, 0.3) 50%, rgba(6, 28, 55, 0.6) 65%, rgba(6, 28, 55, 0.85) 80%, rgba(6, 28, 55, 0.95) 90%, #061c37 100%)',
                                willChange: 'transform',
                              }}
                            />
                          )}
                          {coverVideoUrl && !isImageUrl(coverVideoUrl) && (
                            <div
                              className="absolute inset-0 z-30 flex cursor-pointer items-center justify-center"
                              role="button"
                              aria-label="Reproducir video"
                              onClick={(e) => {
                                e.preventDefault();
                                const parent = e.currentTarget.parentElement;
                                const video = parent?.querySelector(
                                  'video'
                                ) as HTMLVideoElement | null;
                                if (video) {
                                  video.controls = true;
                                  video.focus();
                                  void video.play().catch(console.error);
                                }
                              }}
                            >
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 transition-transform group-hover:scale-110">
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
                                  className="lucide lucide-play ml-1 h-7 w-7 text-black"
                                >
                                  <polygon points="6 3 20 12 6 21 6 3"></polygon>
                                </svg>
                              </div>
                            </div>
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
                          <p className="text-2xl font-bold text-foreground">
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
                                aria-label="Cancelar suscripción al curso"
                                onClick={() => setShowUnenrollDialog(true)}
                                disabled={isUnenrolling}
                                className="group absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-destructive/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                              >
                                <FaTimes className="h-4 w-4 text-emerald-400 transition-colors group-hover:text-red-500" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleContinueCourse}
                              disabled={!continueLessonId}
                              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#22c4d3] px-4 py-2 text-sm font-medium text-[#080c16] ring-offset-background transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0"
                            >
                              <IoPlayOutline className="mr-2 text-black" />
                              Continuar curso
                            </button>
                            {/* Mostrar frase de planes también cuando está inscrito */}
                            {(_hasPro || _hasPremium) && (
                              <p className="text-center text-xs text-[#94A3B8]">
                                Accede a este y a más de{' '}
                                <span className="font-medium text-white">
                                  {totalSimilarCourses}{' '}
                                  {totalSimilarCourses === 1
                                    ? 'curso'
                                    : 'cursos'}
                                </span>{' '}
                                con {planPhrase}.{' '}
                                <a
                                  href="/planes"
                                  className="text-white hover:underline"
                                >
                                  Ver planes
                                </a>
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={handleStartNow}
                              disabled={isEnrolling}
                              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-semibold whitespace-nowrap ring-offset-background transition-all hover:shadow-lg hover:shadow-primary/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                              style={{
                                color: '#080C16',
                                backgroundColor: '#22c4d3e6',
                              }}
                            >
                              {isEnrolling ? 'Inscribiendo…' : 'Empezar Ahora'}
                            </button>
                            {/* Solo mostrar frase de planes cuando el curso tiene tipo Pro o Premium */}
                            {(_hasPro || _hasPremium) && (
                              <p className="text-center text-xs text-[#94A3B8]">
                                Accede a este y a más de{' '}
                                <span className="font-medium text-white">
                                  {totalSimilarCourses}{' '}
                                  {totalSimilarCourses === 1
                                    ? 'curso'
                                    : 'cursos'}
                                </span>{' '}
                                con {planPhrase}.{' '}
                                <a
                                  href="/planes"
                                  className="text-white hover:underline"
                                >
                                  Ver planes
                                </a>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Contenedor principal del contenido del curso */}
                <div
                  className={`space-y-8 ${
                    isEnrolled ? 'lg:col-span-3' : 'lg:col-span-2'
                  }`}
                >
                  <div className="space-y-6">
                    {/* Contenedor flex para info del curso y mini tarjeta lado a lado en lg */}
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                      {/* Columna izquierda: toda la info del curso */}
                      <div className="flex-1 space-y-4">
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
                        <h1 className="font-display text-3xl leading-tight font-bold text-foreground md:text-4xl lg:text-5xl">
                          {course.title}
                        </h1>

                        {/* Rating y estudiantes */}
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

                        {/* Badges de clases y duración */}
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-medium text-foreground">
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
                              className="lucide lucide-book-open h-3.5 w-3.5 text-primary"
                            >
                              <path d="M12 7v14"></path>
                              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                            </svg>
                            {course.lessons?.length ?? 0} clases
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-medium text-foreground">
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
                              className="lucide lucide-clock h-3.5 w-3.5 text-primary"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            40h contenido
                          </span>
                        </div>

                        {/* Nivel, modalidad y horario */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            style={{ backgroundColor: '#1A2333' }}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground"
                          >
                            <RiEqualizer2Line className="h-3 w-3" />
                            {course.nivel
                              ? typeof course.nivel === 'string'
                                ? course.nivel
                                : course.nivel?.name || 'Intermedio'
                              : 'Intermedio'}
                          </span>
                          {course.modalidad && (
                            <span
                              style={{ backgroundColor: '#1A2333' }}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground"
                            >
                              {getModalidadIcon(
                                typeof course.modalidad === 'string'
                                  ? course.modalidad
                                  : course.modalidad.name
                              )}
                              {typeof course.modalidad === 'string'
                                ? course.modalidad
                                : course.modalidad.name}
                            </span>
                          )}
                          {course.scheduleOption?.name || course.horario ? (
                            <span
                              style={{ backgroundColor: '#1A2333' }}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground"
                            >
                              <AiOutlineCalendar className="h-3 w-3" />
                              {course.scheduleOption?.name || course.horario}
                            </span>
                          ) : null}
                          {course.spaceOption?.name || course.espacios ? (
                            <span
                              style={{ backgroundColor: '#1A2333' }}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground"
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
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              {course.spaceOption?.name || course.espacios}
                            </span>
                          ) : null}
                        </div>

                        {/* Descripción */}
                        <p className="text-lg text-[#94A3B8]">
                          {course.description}
                        </p>
                      </div>

                      {/* Columna derecha: mini tarjeta (solo cuando está inscrito en lg) */}
                      {isEnrolled && (
                        <div className="hidden lg:block lg:w-[340px] lg:flex-shrink-0">
                          <div
                            className="relative w-[340px] overflow-hidden rounded-2xl border border-border bg-[#061c37]"
                            style={{
                              borderColor: '#1d283a',
                              borderWidth: '1px',
                            }}
                          >
                            <div className="relative">
                              <AspectRatio ratio={16 / 9}>
                                <div className="relative h-full w-full overflow-hidden">
                                  {coverVideoUrl ? (
                                    isImageUrl(coverVideoUrl) ? (
                                      <Image
                                        src={coverVideoUrl}
                                        alt={course.title}
                                        fill
                                        className="object-cover"
                                        sizes="340px"
                                        quality={85}
                                        loading="eager"
                                        priority={false}
                                      />
                                    ) : (
                                      <video
                                        className="h-full w-full object-cover"
                                        src={coverVideoUrl}
                                        poster={coverImageUrl}
                                        controls
                                      />
                                    )
                                  ) : (
                                    <>
                                      {course.coverImageKey && (
                                        <Image
                                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                                          alt={course.title}
                                          fill
                                          className="object-cover"
                                          sizes="340px"
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
                                <div className="space-y-2">
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
                                      aria-label="Cancelar suscripción al curso"
                                      onClick={() =>
                                        setShowUnenrollDialog(true)
                                      }
                                      disabled={isUnenrolling}
                                      className="group absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-destructive/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                                    >
                                      <FaTimes className="h-4 w-4 text-emerald-400 transition-colors group-hover:text-red-500" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleContinueCourse}
                                    disabled={!continueLessonId}
                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#22c4d3] px-4 py-2 text-sm font-medium text-[#080c16] ring-offset-background transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0"
                                  >
                                    <IoPlayOutline className="mr-2 text-black" />
                                    Continuar curso
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Carousel de botones/resumen (debajo de toda la info) - a ancho completo */}
                    <div className="mt-6">
                      {/* Versión expandida para desktop cuando está suscrito */}
                      {isEnrolled ? (
                        <div className="hidden lg:flex lg:w-full lg:justify-between">
                          {navItems.map((item) => {
                            const isActive = activePill === item.key;
                            const badgeCount = badgeCounts[item.key] ?? 0;
                            const showBadge =
                              badgeCount > 0 && !seenSections[item.key];
                            return (
                              <button
                                key={item.key}
                                onClick={() => handlePillClick(item.key)}
                                className={`flex items-center gap-2 rounded-full border px-[20px] py-[10px] text-sm font-semibold transition-all ${
                                  isActive
                                    ? 'border-[hsl(217,33%,17%)] bg-[#061c37] text-white'
                                    : 'border-transparent bg-transparent text-white/80 hover:border-[hsl(217,33%,17%)]/60 hover:bg-[#061c3780]/50 hover:text-white'
                                }`}
                              >
                                <span>{item.label}</span>
                                {showBadge && (
                                  <span className="inline-flex aspect-square h-6 w-6 justify-center rounded-full border border-white/20 bg-[#22C4D3] pt-[2.5px] text-xs text-black">
                                    {badgeCount}
                                  </span>
                                )}
                                {item.helper && (
                                  <span className="hidden text-xs font-normal text-white/60 xl:inline">
                                    {item.helper}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      {/* Versión con carousel para móvil y desktop no suscrito */}
                      <div
                        className={`${isEnrolled ? 'lg:hidden' : ''} flex items-center gap-2`}
                      >
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
                            gradeSummary={gradeSummary}
                          />
                        ) : (
                          renderAccessGuard('grabadas')
                        )
                      ) : activePill === 'certificacion' ? (
                        isEnrolled ? (
                          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8">
                            <div className="mb-6 flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
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
                                  className="h-6 w-6 text-white"
                                >
                                  <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path>
                                  <circle cx="12" cy="8" r="6"></circle>
                                </svg>
                              </div>
                              <div>
                                <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">
                                  Certificación Del Curso
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                  Completa el 100% para habilitar tu
                                  certificado.
                                </p>
                              </div>
                            </div>

                            <div className="mb-6 rounded-xl bg-secondary p-5">
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">
                                  Progreso hacia la certificación
                                </span>
                                <span className="text-sm font-bold text-primary">
                                  {courseProgressPercent}%
                                </span>
                              </div>
                              <div className="h-3 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                                  style={{ width: `${courseProgressPercent}%` }}
                                />
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {`${completedLessonsCount} de ${totalLessons} clases completadas`}
                              </p>
                            </div>

                            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                              <p className="text-sm text-muted-foreground">
                                El botón se habilita automáticamente cuando
                                alcanzas el 100% del curso.
                              </p>
                              <button
                                type="button"
                                onClick={handleCertificateClick}
                                disabled={!isCertificateUnlocked}
                                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition focus:ring-2 focus:ring-green-400/60 focus:ring-offset-2 focus:ring-offset-card focus:outline-none ${
                                  isCertificateUnlocked
                                    ? 'border-green-500/30 bg-green-500/20 text-green-200 hover:bg-green-500/30'
                                    : 'cursor-not-allowed border-white/10 bg-white/5 text-white/60'
                                }`}
                              >
                                {isCertificateUnlocked ? (
                                  <FaCheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <FaLock className="h-4 w-4 text-white/70" />
                                )}
                                {isCertificateUnlocked
                                  ? 'Ver tu certificado'
                                  : 'Certificado bloqueado'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          renderAccessGuard('certificacion')
                        )
                      ) : activePill === 'foro' ? (
                        isEnrolled ? (
                          <CourseForum courseId={course.id} />
                        ) : (
                          renderAccessGuard('foro')
                        )
                      ) : activePill === 'resultados' ? (
                        isEnrolled ? (
                          <LessonGradeHistoryInline
                            gradeSummary={gradeSummary}
                          />
                        ) : (
                          renderAccessGuard('resultados')
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
                          gradeSummary={gradeSummary}
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
                {!isEnrolled && (
                  <div className="hidden lg:block">
                    <div className="sticky top-24 max-h-[calc(100vh-8rem)] self-start">
                      <div
                        className="relative overflow-hidden rounded-2xl border border-border bg-[#061c37]"
                        style={{ borderColor: '#1d283a', borderWidth: '1px' }}
                      >
                        <div className="relative">
                          <AspectRatio ratio={16 / 9}>
                            <div className="group relative h-full w-full overflow-hidden">
                              {course.coverVideoCourseKey && coverVideoUrl ? (
                                isImageUrl(
                                  course.coverVideoCourseKey as string
                                ) ? (
                                  <Image
                                    src={coverVideoUrl}
                                    alt={course.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1023px) 0px, 33vw"
                                    quality={85}
                                    loading="eager"
                                    priority={false}
                                  />
                                ) : (
                                  <video
                                    className="h-full w-full object-cover"
                                    src={coverVideoUrl}
                                    poster={coverImageUrl}
                                    playsInline
                                  />
                                )
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
                                </>
                              )}
                              {(!course.coverVideoCourseKey ||
                                isImageUrl(
                                  course.coverVideoCourseKey as string
                                )) && (
                                <div
                                  className="pointer-events-none absolute inset-0 z-20"
                                  style={{
                                    background:
                                      'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(6, 28, 55, 0.1) 35%, rgba(6, 28, 55, 0.3) 50%, rgba(6, 28, 55, 0.6) 65%, rgba(6, 28, 55, 0.85) 80%, rgba(6, 28, 55, 0.95) 90%, #061c37 100%)',
                                    willChange: 'transform',
                                  }}
                                />
                              )}
                              {course.coverVideoCourseKey &&
                                coverVideoUrl &&
                                !isImageUrl(
                                  course.coverVideoCourseKey as string
                                ) && (
                                  <div
                                    className="absolute inset-0 z-30 flex cursor-pointer items-center justify-center"
                                    role="button"
                                    aria-label="Reproducir video"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const parent =
                                        e.currentTarget.parentElement;
                                      const video = parent?.querySelector(
                                        'video'
                                      ) as HTMLVideoElement | null;
                                      if (video) {
                                        video.controls = true;
                                        video.focus();
                                        void video.play().catch(console.error);
                                      }
                                    }}
                                  >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 transition-transform group-hover:scale-110">
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
                                        className="lucide lucide-play ml-1 h-7 w-7 text-black"
                                      >
                                        <polygon points="6 3 20 12 6 21 6 3"></polygon>
                                      </svg>
                                    </div>
                                  </div>
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
                                primaryType.requiredSubscriptionLevel ===
                                'premium';
                              const isPro =
                                primaryType.requiredSubscriptionLevel === 'pro';
                              const isFree =
                                primaryType.requiredSubscriptionLevel ===
                                  'none' &&
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
                              <p className="text-2xl font-bold text-foreground">
                                ${' '}
                                {formatPrice(
                                  course.individualPrice ??
                                    course.courseType?.price
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
                            <button
                              onClick={handleStartNow}
                              disabled={isEnrolling}
                              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-semibold whitespace-nowrap ring-offset-background transition-all hover:shadow-lg hover:shadow-primary/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                              style={{
                                color: '#080C16',
                                backgroundColor: '#22c4d3e6',
                              }}
                            >
                              {isEnrolling ? 'Inscribiendo…' : 'Empezar Ahora'}
                            </button>
                            {!(
                              activeCourseTypes.hasIndividual &&
                              !activeCourseTypes.hasPremium &&
                              !activeCourseTypes.hasPro &&
                              !activeCourseTypes.hasFree
                            ) && (
                              <p className="text-center text-xs text-[#94A3B8]">
                                Accede a este y a más de{' '}
                                <span className="font-medium text-white">
                                  {totalSimilarCourses}{' '}
                                  {totalSimilarCourses === 1
                                    ? 'curso'
                                    : 'cursos'}
                                </span>{' '}
                                con {planPhrase}.{' '}
                                <a
                                  href="/planes"
                                  className="text-white hover:underline"
                                >
                                  Ver planes
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                redirectUrlOnAuth=""
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
          }}
          onLoginSuccess={handleLoginSuccess}
          redirectUrl={loginRedirectUrl}
          onSwitchToSignUp={handleSwitchToSignUp}
        />
      )}

      {/* Mini SignUp Modal */}
      {showSignUpModal && (
        <MiniSignUpModal
          isOpen={showSignUpModal}
          onClose={() => {
            setShowSignUpModal(false);
            setPendingOpenPayment(false);
          }}
          onSignUpSuccess={handleSignUpSuccess}
          redirectUrl={`/estudiantes/cursos/${course.id}`}
          onSwitchToLogin={handleSwitchToLogin}
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
