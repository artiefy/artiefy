'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  FaCalendar,
  FaCheck,
  FaClock,
  FaCrown,
  FaExpand,
  FaStar,
  FaTimes,
  FaTrophy,
  FaUserGraduate,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';
import { IoGiftOutline } from 'react-icons/io5';
import { toast } from 'sonner';
import useSWR from 'swr';

import PaymentForm from '~/components/estudiantes/layout/PaymentForm';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '~/components/estudiantes/ui/card';
import { Icons } from '~/components/estudiantes/ui/icons';
import { blurDataURL } from '~/lib/blurDataUrl';
import { cn } from '~/lib/utils';
import { type GradesApiResponse } from '~/lib/utils2';
import { isUserEnrolledInProgram } from '~/server/actions/estudiantes/programs/enrollInProgram';
import { type Product } from '~/types/payu';
import { createProductFromCourse } from '~/utils/paygateway/products';

import { CourseContent } from './CourseContent';
import { GradeModal } from './CourseGradeModal';

import type { Course, CourseMateria } from '~/types';

import '~/styles/paybutton2.css';
import '~/styles/priceindividual.css';

export const revalidate = 3600;

interface ExtendedCourse extends Course {
  progress?: number;
  finalGrade?: number;
}

interface CourseHeaderProps {
  course: ExtendedCourse;
  totalStudents: number;
  isEnrolled: boolean;
  isEnrolling: boolean;
  isUnenrolling: boolean;
  isSubscriptionActive: boolean;
  subscriptionEndDate: string | null;
  onEnrollAction: () => Promise<void>;
  onUnenrollAction: () => Promise<void>;
  isCheckingEnrollment?: boolean;
}

const BADGE_GRADIENTS = [
  'from-pink-500 via-red-500 to-yellow-500',
  'from-green-300 via-blue-500 to-purple-600',
  'from-pink-300 via-purple-300 to-indigo-400',
  'from-yellow-400 via-pink-500 to-red-500',
  'from-blue-400 via-indigo-500 to-purple-600',
  'from-green-400 via-cyan-500 to-blue-500',
  'from-orange-400 via-pink-500 to-red-500',
];

const getBadgeGradient = (index: number) => {
  return BADGE_GRADIENTS[index % BADGE_GRADIENTS.length];
};

// Update fetcher with explicit typing
const fetcher = async (url: string): Promise<GradesApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error fetching grades');
  const data = (await res.json()) as GradesApiResponse;
  return data;
};

// Add error type
interface FetchError {
  error?: string;
  message?: string;
}

const _isVideoMedia = (coverImageKey: string | null | undefined): boolean => {
  return !!coverImageKey?.toLowerCase().endsWith('.mp4');
};

export function CourseHeader({
  course,
  totalStudents,
  isEnrolled,
  isEnrolling,
  isUnenrolling,
  isSubscriptionActive,
  subscriptionEndDate,
  onEnrollAction,
  onUnenrollAction,
}: CourseHeaderProps) {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isLoadingGrade, setIsLoadingGrade] = useState(true);
  const [isEnrollClicked, setIsEnrollClicked] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [programToastShown, setProgramToastShown] = useState(false);
  // Add state to track local enrollment status to hide the top button after enrolling
  const [localIsEnrolled, setLocalIsEnrolled] = useState(isEnrolled);

  // Ref para controlar el video
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handler para pausar/reproducir con click
  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((e) => {
        console.warn('Video play() error:', e);
      });
    } else {
      video.pause();
    }
  };

  // Handler para pantalla completa
  const handleFullscreenClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      void video.requestFullscreen();
    } else if (
      'webkitRequestFullscreen' in video &&
      typeof (
        video as unknown as { webkitRequestFullscreen: () => Promise<void> }
      ).webkitRequestFullscreen === 'function'
    ) {
      void (
        video as unknown as { webkitRequestFullscreen: () => Promise<void> }
      ).webkitRequestFullscreen();
    } else if (
      'msRequestFullscreen' in video &&
      typeof (video as unknown as { msRequestFullscreen: () => Promise<void> })
        .msRequestFullscreen === 'function'
    ) {
      void (
        video as unknown as { msRequestFullscreen: () => Promise<void> }
      ).msRequestFullscreen();
    }
  };

  // Replace useEffect with useSWR
  // Improve error handling with proper types
  const { data: gradesData, error: gradesError } = useSWR<
    GradesApiResponse,
    FetchError
  >(
    user?.id
      ? `/api/grades/materias?userId=${user.id}&courseId=${course.id}`
      : null,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      revalidateOnFocus: true,
    }
  );

  const currentFinalGrade = useMemo(() => {
    if (!gradesData?.materias?.length) return 0;

    // Simplemente calcular el promedio de las notas
    const average =
      gradesData.materias.reduce((acc, materia) => acc + materia.grade, 0) /
      gradesData.materias.length;

    console.log('Cálculo de nota:', {
      materias: gradesData.materias,
      promedio: average,
      mostrarCertificado: average >= 3,
    });

    return Number(average.toFixed(2));
  }, [gradesData]);

  // Update loading state based on SWR
  // Update loading state with proper error handling
  useEffect(() => {
    setIsLoadingGrade(!gradesData && !gradesError);
  }, [gradesData, gradesError]);

  // Debug logs
  // Debug logs with proper error handling
  useEffect(() => {
    console.log('SWR State:', {
      gradesData,
      currentFinalGrade,
      isLoadingGrade,
      error: gradesError?.message ?? 'No error',
      shouldShowCertificate:
        isEnrolled &&
        course.progress === 100 &&
        currentFinalGrade >= 3 &&
        !isLoadingGrade,
    });
  }, [
    gradesData,
    currentFinalGrade,
    isLoadingGrade,
    gradesError,
    isEnrolled,
    course.progress,
  ]);

  // Add debug log for all conditions
  // Add debug log with safer type checking
  useEffect(() => {
    console.log('Debug Certificate Button Conditions:', {
      isEnrolled,
      courseProgress: course.progress,
      currentFinalGrade,
      allConditions: {
        isEnrolled,
        hasProgress: course.progress === 100,
        hasPassingGrade: currentFinalGrade >= 3,
      },
      shouldShowButton:
        isEnrolled && course.progress === 100 && currentFinalGrade >= 3,
    });
  }, [isEnrolled, course.progress, currentFinalGrade]);

  // Add new effect to check program enrollment
  useEffect(() => {
    const checkProgramEnrollment = async () => {
      const programMateria = course.materias?.find(
        (materia) => materia.programaId !== null
      );

      if (programMateria?.programaId && user?.id && !isEnrolled) {
        try {
          // Check if course has both PRO and PREMIUM types
          const hasPremiumType = course.courseTypes?.some(
            (type) => type.requiredSubscriptionLevel === 'premium'
          );
          const hasProType = course.courseTypes?.some(
            (type) => type.requiredSubscriptionLevel === 'pro'
          );

          // If course has both types, don't redirect to program
          if (hasPremiumType && hasProType) {
            return; // Skip program redirection for courses with both PRO and PREMIUM types
          }

          const isProgramEnrolled = await isUserEnrolledInProgram(
            programMateria.programaId,
            user.id
          );

          if (!isProgramEnrolled && !programToastShown) {
            // Only show toast if we haven't shown it yet
            setProgramToastShown(true); // Update state to prevent duplicate toasts
            toast.warning('Este curso requiere inscripción al programa', {
              id: 'program-enrollment', // Add an ID to prevent duplicates
            });
            router.push(`/estudiantes/programas/${programMateria.programaId}`);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          console.error('Error checking program enrollment:', errorMessage);
        }
      }
    };

    void checkProgramEnrollment();
  }, [
    course.materias,
    course.courseTypes,
    user?.id,
    isEnrolled,
    router,
    programToastShown,
  ]);

  // Helper function to format dates
  const formatDateString = (date: string | number | Date): string => {
    // Cambiar a formato año/día/mes
    const d = new Date(date);
    const year = d.getFullYear();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}/${day}/${month}`;
  };

  const areAllLessonsCompleted = useMemo(() => {
    return (
      course.lessons?.every((lesson) => lesson.porcentajecompletado === 100) ??
      false
    );
  }, [course.lessons]);

  const canAccessGrades = isEnrolled && areAllLessonsCompleted;
  const canAccessCertificate = canAccessGrades && currentFinalGrade >= 3;

  const getCourseTypeLabel = () => {
    // Obtener el tipo de suscripción del usuario actual
    const userPlanType = user?.publicMetadata?.planType as string;
    const hasActiveSubscription =
      isSignedIn &&
      (userPlanType === 'Pro' || userPlanType === 'Premium') &&
      isSubscriptionActive;

    // Si el curso tiene múltiples tipos, determinar cuál mostrar según la suscripción
    if (course.courseTypes && course.courseTypes.length > 0) {
      // Verificar cada tipo por orden de prioridad
      const hasPurchasable = course.courseTypes.some(
        (type) => type.isPurchasableIndividually
      );
      const hasPremium = course.courseTypes.some(
        (type) => type.requiredSubscriptionLevel === 'premium'
      );
      const hasPro = course.courseTypes.some(
        (type) => type.requiredSubscriptionLevel === 'pro'
      );
      const hasFree = course.courseTypes.some(
        (type) =>
          type.requiredSubscriptionLevel === 'none' &&
          !type.isPurchasableIndividually
      );

      // Crear un array con los tipos adicionales para la etiqueta "Incluido en"
      const includedInPlans: string[] = [];

      if (course.courseTypes.length > 1) {
        if (hasPremium) includedInPlans.push('PREMIUM');
        if (hasPro) includedInPlans.push('PRO');
        if (hasFree) includedInPlans.push('GRATUITO');
      }

      // LÓGICA PARA USUARIO CON SESIÓN Y SUSCRIPCIÓN ACTIVA
      if (hasActiveSubscription) {
        // Mostrar el tipo de acuerdo a la suscripción del usuario
        if (userPlanType === 'Premium' && hasPremium) {
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FaCrown className="text-lg text-purple-500" />
                <span className="text-base font-bold text-purple-500">
                  PREMIUM
                </span>
              </div>
              {includedInPlans.length > 0 &&
                includedInPlans.filter((p) => p !== 'PREMIUM').length > 0 && (
                  <Badge
                    className="cursor-pointer bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500"
                    onClick={handlePlanBadgeClick}
                  >
                    Incluido en:{' '}
                    {includedInPlans
                      .filter((p) => p !== 'PREMIUM')
                      .map((p, idx, arr) => (
                        <span key={p} className="font-bold">
                          {p}
                          {idx < arr.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                  </Badge>
                )}
            </div>
          );
        }

        if ((userPlanType === 'Pro' || userPlanType === 'Premium') && hasPro) {
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FaCrown className="text-lg text-orange-500" />
                <span className="text-base font-bold text-orange-500">PRO</span>
              </div>
              {includedInPlans.length > 0 &&
                includedInPlans.filter((p) => p !== 'PRO').length > 0 && (
                  <Badge
                    className="cursor-pointer bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500"
                    onClick={handlePlanBadgeClick}
                  >
                    Incluido en:{' '}
                    {includedInPlans
                      .filter((p) => p !== 'PRO')
                      .map((p, idx, arr) => (
                        <span key={p} className="font-bold">
                          {p}
                          {idx < arr.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                  </Badge>
                )}
            </div>
          );
        }

        if (hasFree) {
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <IoGiftOutline className="text-lg text-green-500" />
                <span className="text-base font-bold text-green-500">
                  GRATUITO
                </span>
              </div>
              {includedInPlans.length > 0 &&
                includedInPlans.filter((p) => p !== 'GRATUITO').length > 0 && (
                  <Badge
                    className="cursor-pointer bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500"
                    onClick={handlePlanBadgeClick}
                  >
                    Incluido en:{' '}
                    {includedInPlans
                      .filter((p) => p !== 'GRATUITO')
                      .map((p, idx, arr) => (
                        <span key={p} className="font-bold">
                          {p}
                          {idx < arr.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                  </Badge>
                )}
            </div>
          );
        }

        // Si tiene suscripción pero ningún tipo coincide, mostrar opción de compra individual si está disponible
        if (hasPurchasable) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FaStar className="text-lg text-blue-500" />
                <span className="text-base font-bold text-blue-500">
                  ${' '}
                  {(
                    course.individualPrice ??
                    purchasableType?.price ??
                    0
                  ).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              {includedInPlans.length > 0 && (
                <>
                  {/* Mobile view */}
                  <div
                    className="block cursor-pointer text-xs text-gray-300 italic sm:hidden"
                    onClick={handlePlanBadgeClick}
                  >
                    Incluido en:{' '}
                    {includedInPlans.map((p, idx, arr) => (
                      <span key={p} className="font-bold">
                        {p}
                        {idx < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  {/* Desktop view as badge */}
                  <div className="hidden sm:block">
                    <Badge
                      className="cursor-pointer bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500"
                      onClick={handlePlanBadgeClick}
                    >
                      Incluido en:{' '}
                      {includedInPlans.map((p, idx, arr) => (
                        <span key={p} className="font-bold">
                          {p}
                          {idx < arr.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          );
        }
      }
      // LÓGICA PARA USUARIO SIN SESIÓN O SIN SUSCRIPCIÓN ACTIVA
      else {
        // 1. Individual (si existe)
        if (hasPurchasable) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FaStar className="text-lg text-blue-500" />
                <span className="text-base font-bold text-blue-500">
                  ${' '}
                  {(
                    course.individualPrice ??
                    purchasableType?.price ??
                    0
                  ).toLocaleString('es-CO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              {includedInPlans.length > 0 && (
                <>
                  {/* Mobile view */}
                  <div
                    className="block cursor-pointer text-xs text-gray-300 italic sm:hidden"
                    onClick={handlePlanBadgeClick}
                  >
                    Incluido en:{' '}
                    {includedInPlans.map((p, idx, arr) => (
                      <span key={p} className="font-bold">
                        {p}
                        {idx < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  {/* Desktop view as badge */}
                  <div className="hidden sm:block">
                    <Badge
                      className="cursor-pointer bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500"
                      onClick={handlePlanBadgeClick}
                    >
                      Incluido en:{' '}
                      {includedInPlans.map((p, idx, arr) => (
                        <span key={p} className="font-bold">
                          {p}
                          {idx < arr.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          );
        }

        // 2. Premium (si existe)
        if (hasPremium) {
          const otherPlans = includedInPlans.filter((p) => p !== 'PREMIUM');
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FaCrown className="text-lg text-purple-500" />
                <span className="text-base font-bold text-purple-500">
                  PREMIUM
                </span>
              </div>
              {otherPlans.length > 0 && (
                <>
                  {/* Mobile view */}
                  <div
                    className="block cursor-pointer text-xs text-gray-300 italic sm:hidden"
                    onClick={handlePlanBadgeClick}
                  >
                    Incluido en:{' '}
                    {otherPlans.map((p, idx, arr) => (
                      <span key={p} className="font-bold">
                        {p}
                        {idx < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  {/* Desktop view as badge */}
                  <div className="hidden sm:block">
                    <Badge
                      className="cursor-pointer bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500"
                      onClick={handlePlanBadgeClick}
                    >
                      Incluido en:{' '}
                      {otherPlans.map((p, idx, arr) => (
                        <span key={p} className="font-bold">
                          {p}
                          {idx < arr.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          );
        }

        // 3. Pro (si existe)
        if (hasPro) {
          const otherPlans = includedInPlans.filter((p) => p !== 'PRO');
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <FaCrown className="text-lg text-orange-500" />
                <span className="text-base font-bold text-orange-500">PRO</span>
              </div>
              {otherPlans.length > 0 && (
                <>
                  {/* Mobile view */}
                  <div
                    className="block cursor-pointer text-xs text-gray-300 italic sm:hidden"
                    onClick={handlePlanBadgeClick}
                  >
                    Incluido en:{' '}
                    {otherPlans.map((p, idx, arr) => (
                      <span key={p} className="font-bold">
                        {p}
                        {idx < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  {/* Desktop view as badge */}
                  <div className="hidden sm:block">
                    <Badge
                      className="cursor-pointer bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500"
                      onClick={handlePlanBadgeClick}
                    >
                      Incluido en:{' '}
                      {otherPlans.map((p, idx, arr) => (
                        <span key={p} className="font-bold">
                          {p}
                          {idx < arr.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          );
        }

        // 4. Free (si existe)
        if (hasFree) {
          const otherPlans = includedInPlans.filter((p) => p !== 'GRATUITO');
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <IoGiftOutline className="text-lg text-green-500" />
                <span className="text-base font-bold text-green-500">
                  GRATUITO
                </span>
              </div>
              {otherPlans.length > 0 && (
                <>
                  {/* Mobile view */}
                  <div
                    className="block cursor-pointer text-xs text-gray-300 italic sm:hidden"
                    onClick={handlePlanBadgeClick}
                  >
                    Incluido en:{' '}
                    {otherPlans.map((p, idx, arr) => (
                      <span key={p} className="font-bold">
                        {p}
                        {idx < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                  {/* Desktop view as badge */}
                  <div className="hidden sm:block">
                    <Badge
                      className="cursor-pointer bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500"
                      onClick={handlePlanBadgeClick}
                    >
                      Incluido en:{' '}
                      {otherPlans.map((p, idx, arr) => (
                        <span key={p} className="font-bold">
                          {p}
                          {idx < arr.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          );
        }
      }
    }

    // Fallback para compatibilidad con cursos que solo usan courseType
    const courseType = course.courseType;
    if (!courseType) {
      return null;
    }

    // Mostrar el precio individual cuando el curso es tipo 4
    if (course.courseTypeId === 4 && course.individualPrice) {
      return (
        <div className="flex items-center gap-1">
          <FaStar className="text-lg text-blue-500" />
          <span className="text-base font-bold text-blue-500">
            ${' '}
            {course.individualPrice.toLocaleString('es-CO', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      );
    }

    const { requiredSubscriptionLevel } = courseType;

    if (requiredSubscriptionLevel === 'none') {
      return (
        <div className="flex items-center gap-1">
          <IoGiftOutline className="text-lg text-green-500" />
          <span className="text-base font-bold text-green-500">GRATUITO</span>
        </div>
      );
    }

    const color =
      requiredSubscriptionLevel === 'premium'
        ? 'text-purple-500'
        : 'text-orange-500';

    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <FaCrown className="text-lg" />
        <span className="text-base font-bold">
          {requiredSubscriptionLevel.toUpperCase()}
        </span>
      </div>
    );
  };

  const handleEnrollClick = async () => {
    if (!isSignedIn) {
      // Store purchase intent in localStorage before redirecting for ALL purchasable courses
      if (
        course.courseTypeId === 4 ||
        course.courseTypes?.some((type) => type.isPurchasableIndividually)
      ) {
        console.log('Storing pending purchase before login redirect');
        const pendingPurchase: PendingPurchase = {
          courseId: course.id,
          type: 'individual',
        };
        localStorage.setItem(
          'pendingPurchase',
          JSON.stringify(pendingPurchase)
        );
      }

      // Show toast first
      toast.error('Inicio de sesión requerido', {
        description: 'Debes iniciar sesión para inscribirte en este curso',
        duration: 3000,
      });

      // Wait for toast to be visible
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const currentPath = `/estudiantes/cursos/${course.id}`;
      const returnUrl = encodeURIComponent(currentPath);

      // Use window.location for a hard redirect instead of router.push
      window.location.href = `/sign-in?redirect_url=${returnUrl}`;
      return;
    }

    // *** DEBUGGING - Log what's happening at this point ***
    console.log('Button clicked, course details:', {
      courseTypeId: course.courseTypeId,
      individualPrice: course.individualPrice,
      hasPurchasableType: course.courseTypes?.some(
        (type) => type.isPurchasableIndividually
      ),
      isPurchasable:
        course.courseTypeId === 4 ||
        course.courseTypes?.some((type) => type.isPurchasableIndividually),
    });

    setIsEnrollClicked(true);

    try {
      // FIRST, CHECK IF USER CAN ACCESS VIA SUBSCRIPTION
      const userPlanType = user?.publicMetadata?.planType as string;

      // Check if the user's subscription level gives them access
      const hasPremiumType = course.courseTypes?.some(
        (type) => type.requiredSubscriptionLevel === 'premium'
      );
      const hasProType = course.courseTypes?.some(
        (type) => type.requiredSubscriptionLevel === 'pro'
      );

      // Fix this line - use logical OR instead of nullish coalescing

      const userCanAccessWithSubscription =
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        (userPlanType === 'Premium' && hasPremiumType) ||
        ((userPlanType === 'Pro' || userPlanType === 'Premium') && hasProType);

      // If user has subscription access and subscription is active, proceed with direct enrollment
      if (userCanAccessWithSubscription && isSubscriptionActive) {
        console.log(
          'User has subscription access to this course. Proceeding with direct enrollment.'
        );

        // Check if course requires program enrollment first
        const programMateria = course.materias?.find(
          (materia) => materia.programaId !== null
        );

        if (programMateria?.programaId) {
          try {
            // If course has both PRO and PREMIUM types, don't redirect to program
            if (hasPremiumType && hasProType) {
              // Skip program check for courses with both types
              console.log(
                'Course has both PRO and PREMIUM types - skipping program redirect'
              );
            } else {
              const isProgramEnrolled = await isUserEnrolledInProgram(
                programMateria.programaId,
                user?.id ?? ''
              );

              if (!isProgramEnrolled) {
                // Show toast and redirect to program page
                setProgramToastShown(true);
                toast.warning(
                  `Este curso requiere inscripción al programa "${programMateria.programa?.title}"`,
                  {
                    description:
                      'Serás redirigido a la página del programa para inscribirte.',
                    duration: 4000,
                    id: 'program-enrollment',
                  }
                );

                // Wait a moment for the toast to be visible
                await new Promise((resolve) => setTimeout(resolve, 1000));
                router.push(
                  `/estudiantes/programas/${programMateria.programaId}`
                );
                return;
              }
            }
          } catch (error) {
            console.error('Error checking program enrollment:', error);
            toast.error('Error al verificar la inscripción al programa');
            return;
          }
        }

        // If we get here, proceed with enrollment via subscription
        console.log('Calling onEnrollAction for subscription user');
        await onEnrollAction();
        return;
      }

      // If user doesn't have subscription access, continue with individual purchase logic
      // HANDLE INDIVIDUAL PURCHASE
      const isPurchasable =
        course.courseTypeId === 4 ||
        course.courseTypes?.some((type) => type.isPurchasableIndividually);

      if (isPurchasable) {
        console.log('Course is purchasable - showing payment modal');

        let price: number | null = null;

        if (course.courseTypeId === 4) {
          price = course.individualPrice;
        } else {
          const purchasableType = course.courseTypes?.find(
            (type) => type.isPurchasableIndividually
          );
          price = course.individualPrice ?? purchasableType?.price ?? null;
        }

        if (!price) {
          toast.error('Error en el precio del curso');
          return;
        }

        // Create product with correct price
        const courseProduct = createProductFromCourse({
          ...course,
          individualPrice: price,
        });

        console.log('Created course product:', courseProduct);

        // Set the product and show the modal
        setSelectedProduct(courseProduct);
        setShowPaymentModal(true);
        return;
      }

      // For free courses and other non-purchasable courses
      console.log(
        'Course is not purchasable - calling onEnrollAction directly'
      );
      await onEnrollAction();
      setLocalIsEnrolled(true); // Mark as enrolled locally after successful enrollment
    } catch (error) {
      console.error('Error in handleEnrollClick:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al procesar la acción', {
        description: errorMessage,
      });
    } finally {
      setIsEnrollClicked(false);
    }
  };

  // Create product object for individual course
  const courseProduct = useMemo(() => {
    // Handle traditional Type 4 courses
    if (course.courseTypeId === 4 && course.individualPrice) {
      return createProductFromCourse(course);
    }

    // Also handle courses with purchasable types in the new system
    const purchasableType = course.courseTypes?.find(
      (type) => type.isPurchasableIndividually
    );
    if (purchasableType && (course.individualPrice || purchasableType.price)) {
      const price = course.individualPrice ?? purchasableType.price;
      if (price) {
        return createProductFromCourse({
          ...course,
          individualPrice: price,
        });
      }
    }

    return null;
  }, [course]);

  // Add this interface near the top of the file with other interfaces
  interface PendingPurchase {
    courseId: number;
    type: 'individual';
  }

  // Update the useEffect that checks for pending purchase to log more details
  useEffect(() => {
    // Check for pending purchase after login
    const pendingPurchaseStr = localStorage.getItem('pendingPurchase');
    if (pendingPurchaseStr && isSignedIn) {
      try {
        const pendingPurchase = JSON.parse(
          pendingPurchaseStr
        ) as PendingPurchase;

        console.log('Found pending purchase after login:', {
          pendingPurchase,
          currentCourseId: course.id,
          hasCourseProduct: !!courseProduct,
          coursePrice: course.individualPrice,
          isPurchasable:
            course.courseTypeId === 4 ||
            course.courseTypes?.some((t) => t.isPurchasableIndividually),
        });

        if (
          pendingPurchase.courseId === course.id &&
          pendingPurchase.type === 'individual'
        ) {
          // Clear the pending purchase
          localStorage.removeItem('pendingPurchase');
          console.log('Removed pending purchase, opening payment modal');

          // Generate product if needed and show the modal
          if (courseProduct) {
            console.log('Using course product from useMemo');
            setSelectedProduct(courseProduct);
            setShowPaymentModal(true);
          } else {
            // Fallback to create product directly if useMemo didn't work
            console.log('Creating product directly as fallback');
            const fallbackProduct = createProductFromCourse(course);
            setSelectedProduct(fallbackProduct);
            setShowPaymentModal(true);
          }
        }
      } catch (error) {
        console.error('Error processing pending purchase:', error);
      }
    }
  }, [isSignedIn, course.id, courseProduct, course]);

  // Añade aquí la obtención de las keys
  const coverImageKey = course.coverImageKey;
  const coverVideoCourseKey =
    typeof course === 'object' && 'coverVideoCourseKey' in course
      ? (course as { coverVideoCourseKey?: string }).coverVideoCourseKey
      : undefined;

  // Estado para el volumen y mute
  const [videoVolume, setVideoVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);

  // Efecto para reproducir automáticamente el video al cargar la portada
  useEffect(() => {
    if (coverVideoCourseKey && videoRef.current) {
      const video = videoRef.current;
      video.muted = isMuted;
      video.volume = videoVolume;
      // Quitar video.load() para evitar reinicio del video
      // video.preload = 'auto';
      // video.load();
      const tryPlay = () => {
        video.play().catch(() => {
          const onUserGesture = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {
                // intentionally empty: autoplay fallback
              });
            }
            window.removeEventListener('pointerdown', onUserGesture);
            window.removeEventListener('keydown', onUserGesture);
          };
          window.addEventListener('pointerdown', onUserGesture, { once: true });
          window.addEventListener('keydown', onUserGesture, { once: true });
        });
      };
      if (video.readyState >= 2) {
        tryPlay();
      } else {
        video.addEventListener('canplay', tryPlay, { once: true });
      }
      return () => {
        video.removeEventListener('canplay', tryPlay);
      };
    }
  }, [coverVideoCourseKey, videoVolume, isMuted]);

  // Handler para cambiar el volumen y mute
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setVideoVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      if (value === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  // Handler para alternar mute con el icono
  const handleToggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
        if (videoRef.current.volume === 0) {
          setVideoVolume(1);
          videoRef.current.volume = 1;
        }
        // Si el video está pausado, intenta reproducirlo
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {
            // fallback: no hacer nada si falla
          });
        }
      } else {
        setIsMuted(true);
        videoRef.current.muted = true;
      }
    }
  };

  // Update the getEnrollButtonText function to show appropriate text based on subscription status
  const getEnrollButtonText = (): string => {
    const userPlanType = user?.publicMetadata?.planType as string;
    const userHasActiveSubscription =
      isSignedIn &&
      isSubscriptionActive &&
      (userPlanType === 'Pro' || userPlanType === 'Premium');

    // For individually purchasable courses
    const isPurchasableIndividually =
      course.courseTypeId === 4 ||
      course.courseTypes?.some((type) => type.isPurchasableIndividually);

    // Check if the user's subscription covers this course
    const hasPremiumType = course.courseTypes?.some(
      (type) => type.requiredSubscriptionLevel === 'premium'
    );
    const hasProType = course.courseTypes?.some(
      (type) => type.requiredSubscriptionLevel === 'pro'
    );

    const userCanAccessWithSubscription =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (userPlanType === 'Premium' && hasPremiumType) ||
      ((userPlanType === 'Pro' || userPlanType === 'Premium') && hasProType);

    // Always show "Comprar Curso" for individual courses without active subscription
    if (isPurchasableIndividually && !userCanAccessWithSubscription) {
      return 'Comprar Curso';
    }

    // For logged-in users with subscription that covers this course
    if (
      isSignedIn &&
      userHasActiveSubscription &&
      userCanAccessWithSubscription
    ) {
      return 'Inscribirse al Curso';
    }

    // For users without a session, show appropriate text based on course type
    if (!isSignedIn) {
      if (course.courseTypes && course.courseTypes.length > 0) {
        if (hasPremiumType) return 'Plan Premium';
        if (hasProType) return 'Plan Pro';
        if (
          course.courseTypes.some(
            (type) =>
              type.requiredSubscriptionLevel === 'none' &&
              !type.isPurchasableIndividually
          )
        )
          return 'Inscribirse Gratis';
      }

      // Fallback to course.courseType
      if (course.courseType) {
        if (course.courseType.requiredSubscriptionLevel === 'premium')
          return 'Plan Premium';
        if (course.courseType.requiredSubscriptionLevel === 'pro')
          return 'Plan Pro';
        if (course.courseType.requiredSubscriptionLevel === 'none')
          return 'Inscribirse Gratis';
      }

      return 'Iniciar Sesión';
    }

    // For logged in users
    if (course.courseType?.requiredSubscriptionLevel === 'none') {
      return 'Inscribirse Gratis';
    }

    if (!isSubscriptionActive) {
      return 'Obtener Suscripción';
    }

    return 'Inscribirse al Curso';
  };

  // Get price display function - update to respect subscription status
  const getButtonPrice = (): string | null => {
    const buttonUserPlanType = user?.publicMetadata?.planType as string;
    const buttonUserHasActiveSubscription =
      isSignedIn &&
      isSubscriptionActive &&
      (buttonUserPlanType === 'Pro' || buttonUserPlanType === 'Premium');

    // Check if the user's subscription covers this course
    const buttonHasPremiumType = course.courseTypes?.some(
      (type) => type.requiredSubscriptionLevel === 'premium'
    );
    const buttonHasProType = course.courseTypes?.some(
      (type) => type.requiredSubscriptionLevel === 'pro'
    );

    const userCanAccessWithSubscription =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (buttonUserPlanType === 'Premium' && buttonHasPremiumType) ||
      ((buttonUserPlanType === 'Pro' || buttonUserPlanType === 'Premium') &&
        buttonHasProType);

    // Don't show price if user has subscription access
    if (buttonUserHasActiveSubscription && userCanAccessWithSubscription) {
      return null;
    }

    // Show price for purchase type courses
    if (course.courseTypeId === 4 && course.individualPrice) {
      return (
        '$ ' +
        course.individualPrice.toLocaleString('es-CO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      );
    }

    // For individually purchasable courses via courseTypes
    const purchasableType = course.courseTypes?.find(
      (type) => type.isPurchasableIndividually
    );
    if (purchasableType?.price || course.individualPrice) {
      const price = course.individualPrice ?? purchasableType?.price ?? 0;
      return (
        '$ ' +
        price.toLocaleString('es-CO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      );
    }

    return null;
  };

  // Extraer el botón de compra individual para reutilizarlo
  const renderBuyButton = () => {
    // Don't show the button if locally enrolled
    if (localIsEnrolled) {
      return null;
    }

    // Obtener información del usuario y suscripción
    const renderUserPlanType = user?.publicMetadata?.planType as string;
    const userHasActiveSubscription =
      isSignedIn &&
      isSubscriptionActive &&
      (renderUserPlanType === 'Pro' || renderUserPlanType === 'Premium');

    // Verificar si el curso tiene tipos que coinciden con la suscripción del usuario
    const renderHasPremiumType = course.courseTypes?.some(
      (type) => type.requiredSubscriptionLevel === 'premium'
    );
    const renderHasProType = course.courseTypes?.some(
      (type) => type.requiredSubscriptionLevel === 'pro'
    );
    const renderHasFreeType = course.courseTypes?.some(
      (type) =>
        type.requiredSubscriptionLevel === 'none' &&
        !type.isPurchasableIndividually
    );
    const _renderHasPurchasable = course.courseTypes?.some(
      (type) => type.isPurchasableIndividually
    );

    // Calculate userCanAccessWithSubscription within this function scope

    const renderUserCanAccessWithSubscription =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (renderUserPlanType === 'Premium' && renderHasPremiumType) ||
      ((renderUserPlanType === 'Pro' || renderUserPlanType === 'Premium') &&
        renderHasProType);

    // IMPORTANT: Changed logic to prioritize subscription access over purchase options
    // If user has active subscription and can access this course with it, show the enrollment button
    if (userHasActiveSubscription && renderUserCanAccessWithSubscription) {
      return (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleEnrollClick}
            className="btn"
            disabled={isEnrolling || isEnrollClicked}
          >
            <strong>
              {isEnrolling || isEnrollClicked ? (
                <Icons.spinner className="h-6 w-6" />
              ) : (
                <span>Inscribirse al Curso</span>
              )}
            </strong>
            <div id="container-stars">
              <div id="stars" />
            </div>
            <div id="glow">
              <div className="circle" />
              <div className="circle" />
            </div>
          </button>
        </div>
      );
    }

    // Free course enrollment button - only show if user doesn't have subscription access
    if (renderHasFreeType && !renderHasPremiumType && !renderHasProType) {
      return (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleEnrollClick}
            className="btn"
            disabled={isEnrolling || isEnrollClicked}
          >
            <strong>
              {isEnrolling || isEnrollClicked ? (
                <Icons.spinner className="h-6 w-6" />
              ) : (
                <span>Inscribirse Gratis</span>
              )}
            </strong>
            <div id="container-stars">
              <div id="stars" />
            </div>
            <div id="glow">
              <div className="circle" />
              <div className="circle" />
            </div>
          </button>
        </div>
      );
    }

    // Purchase buttons - only show if user doesn't have subscription access
    // Verificar si es un curso tipo 4 (sistema tradicional)
    if (course.courseTypeId === 4 && course.individualPrice) {
      return (
        <div className="flex flex-col items-center gap-4">
          <button onClick={handleEnrollClick} className="btn">
            <strong>
              <span>
                ${' '}
                {course.individualPrice.toLocaleString('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
              <span>Comprar Curso</span>
            </strong>
            <div id="container-stars">
              <div id="stars" />
            </div>
            <div id="glow">
              <div className="circle" />
              <div className="circle" />
            </div>
          </button>
        </div>
      );
    }

    // Verificar si es un curso con tipo individual (sistema nuevo)
    const purchasableType = course.courseTypes?.find(
      (type) => type.isPurchasableIndividually
    );

    if (purchasableType && (course.individualPrice || purchasableType.price)) {
      const price = course.individualPrice ?? purchasableType.price;
      return (
        <div className="flex flex-col items-center gap-4">
          <button onClick={handleEnrollClick} className="btn">
            <strong>
              <span>
                ${' '}
                {price?.toLocaleString('es-CO', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
              <span>Comprar Curso</span>
            </strong>
            <div id="container-stars">
              <div id="stars" />
            </div>
            <div id="glow">
              <div className="circle" />
              <div className="circle" />
            </div>
          </button>
        </div>
      );
    }

    return null;
  };

  // Add a function to handle plan badge click
  const handlePlanBadgeClick = () => {
    window.open('/planes', '_blank', 'noopener,noreferrer');
  };

  // Update local enrollment status when the prop changes
  useEffect(() => {
    setLocalIsEnrolled(isEnrolled);
  }, [isEnrolled]);

  return (
    <Card className="overflow-hidden bg-gray-800 p-0 text-white">
      <CardHeader className="px-0">
        {/* Removed negative margin to show full cover image on all screen sizes */}
        <div className="relative mb-4 w-full transition-all duration-200">
          {/* Use consistent aspect ratio on all screen sizes */}
          <AspectRatio ratio={16 / 9} className="w-full">
            {/* Nueva lógica de portada/video */}
            {coverVideoCourseKey ? (
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverVideoCourseKey}`}
                  className="h-full w-full cursor-pointer object-cover"
                  autoPlay
                  loop
                  playsInline
                  controls={false}
                  muted={isMuted}
                  preload="auto"
                  poster={
                    coverImageKey
                      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`.trimEnd()
                      : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
                  }
                  onClick={handleVideoClick}
                  // Forzar el navegador a usar el tamaño y renderizado óptimo
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    imageRendering: 'auto', // No afecta mucho a video, pero asegura que no haya suavizado innecesario
                  }}
                />
                {/* Botón de volumen y pantalla completa */}
                <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2 sm:right-4 sm:bottom-4">
                  {/* Botón mute/unmute */}
                  <button
                    type="button"
                    aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                    onClick={handleToggleMute}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-none bg-black/60 p-1 text-white transition-all sm:h-10 sm:w-10 sm:p-2"
                  >
                    {isMuted ? (
                      <FaVolumeMute className="h-2.5 w-2.5 sm:h-5 sm:w-5" />
                    ) : (
                      <FaVolumeUp className="h-2.5 w-2.5 sm:h-5 sm:w-5" />
                    )}
                  </button>
                  {/* Volumen */}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={videoVolume}
                    onChange={handleVolumeChange}
                    className="mr-1 h-2 w-10 accent-cyan-300 sm:mr-2 sm:h-3 sm:w-20"
                    title="Volumen"
                  />
                  {/* Botón pantalla completa */}
                  <button
                    type="button"
                    aria-label="Pantalla completa"
                    onClick={handleFullscreenClick}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-none bg-black/60 p-1 text-white transition-all sm:h-10 sm:w-10 sm:p-2"
                  >
                    <FaExpand className="h-2.5 w-2.5 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            ) : coverImageKey ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`.trimEnd()}
                alt={course.title}
                fill
                className="min-h-[180px] object-cover sm:min-h-[340px] md:min-h-[400px] lg:min-h-[480px]"
                priority
                sizes="100vw"
                placeholder="blur"
                blurDataURL={blurDataURL}
              />
            ) : (
              <Image
                src="https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT"
                alt={course.title}
                fill
                className="min-h-[180px] object-cover sm:min-h-[340px] md:min-h-[400px] lg:min-h-[480px]"
                priority
                sizes="100vw"
                placeholder="blur"
                blurDataURL={blurDataURL}
              />
            )}
          </AspectRatio>
        </div>
        {/* Removed mobile metadata section from here */}
      </CardHeader>
      <CardContent className="mx-auto w-full max-w-7xl space-y-4 px-4 sm:px-6">
        {/* Course titles - desktop and mobile */}
        <div className="w-full">
          {/* Título en móviles */}
          <h1 className="-mt-7 mb-2 line-clamp-2 text-lg font-bold text-cyan-300 sm:hidden">
            {course.title}
          </h1>

          {/* Título en desktop - adjusted top margin */}
          <h1 className="mb-2 line-clamp-2 hidden text-xl font-bold text-cyan-300 sm:-mt-6 sm:block md:text-2xl lg:text-3xl">
            {course.title}
          </h1>
        </div>

        {/* MOVED: Mobile metadata section - now below title in mobile view */}
        <div className="relative z-10 -mt-2 mb-2 block w-full sm:hidden">
          <div className="flex items-center justify-between gap-2">
            {/* Categoría alineada a la izquierda */}
            <Badge
              variant="outline"
              className="border-primary bg-background text-primary w-fit flex-shrink-0 hover:bg-black/70"
            >
              {course.category?.name}
            </Badge>

            {/* Tipo principal + incluidos alineados a la derecha */}
            <div className="ml-auto flex items-center gap-1 text-xs">
              {(() => {
                // Lógica para mostrar el tipo principal y los incluidos
                if (course.courseTypes && course.courseTypes.length > 0) {
                  // Determinar el tipo predominante
                  const hasPremium = course.courseTypes.some(
                    (type) => type.requiredSubscriptionLevel === 'premium'
                  );
                  const hasPro = course.courseTypes.some(
                    (type) => type.requiredSubscriptionLevel === 'pro'
                  );
                  const hasFree = course.courseTypes.some(
                    (type) =>
                      type.requiredSubscriptionLevel === 'none' &&
                      !type.isPurchasableIndividually
                  );
                  const hasPurchasable = course.courseTypes.some(
                    (type) => type.isPurchasableIndividually
                  );

                  // Determinar tipo principal
                  let mainType = '';
                  let mainIcon = null;
                  let mainColor = '';

                  if (hasPurchasable) {
                    const purchasableType = course.courseTypes.find(
                      (type) => type.isPurchasableIndividually
                    );
                    const price =
                      course.individualPrice ?? purchasableType?.price ?? 0;
                    mainType = `$${price.toLocaleString('es-CO')}`;
                    mainIcon = <FaStar className="text-xs text-blue-500" />;
                    mainColor = 'text-blue-500';
                  } else if (hasPremium) {
                    mainType = 'PREMIUM';
                    mainIcon = <FaCrown className="text-xs text-purple-500" />;
                    mainColor = 'text-purple-500';
                  } else if (hasPro) {
                    mainType = 'PRO';
                    mainIcon = <FaCrown className="text-xs text-orange-500" />;
                    mainColor = 'text-orange-500';
                  } else if (hasFree) {
                    mainType = 'GRATUITO';
                    mainIcon = (
                      <IoGiftOutline className="text-xs text-green-500" />
                    );
                    mainColor = 'text-green-500';
                  }

                  // Crear lista de tipos incluidos (excluyendo el principal)
                  const includedTypes = [];
                  if (hasPremium && mainType !== 'PREMIUM')
                    includedTypes.push('PREMIUM');
                  if (hasPro && mainType !== 'PRO') includedTypes.push('PRO');
                  if (hasFree && mainType !== 'GRATUITO')
                    includedTypes.push('GRATUITO');

                  return (
                    <div className="flex flex-wrap items-center gap-1">
                      {/* Tipo principal */}
                      <div
                        className={`flex items-center gap-0.5 ${mainColor} font-bold`}
                      >
                        {mainIcon}
                        <span className="text-xs whitespace-nowrap">
                          {mainType}
                        </span>
                      </div>

                      {/* Badge con "Incluido en:" similar al desktop */}
                      {includedTypes.length > 0 && (
                        <div className="ml-1">
                          <Badge
                            className="cursor-pointer bg-yellow-400 px-1 py-0.5 text-[10px] text-gray-900 hover:bg-yellow-500"
                            onClick={handlePlanBadgeClick}
                          >
                            Incluido en:{' '}
                            <span className="font-bold">
                              {includedTypes.join(', ')}
                            </span>
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                }

                // Fallback para cursos con courseType tradicional
                if (course.courseTypeId === 4 && course.individualPrice) {
                  return (
                    <div className="flex items-center gap-0.5 font-bold text-blue-500">
                      <FaStar className="text-xs" />
                      <span className="text-xs">
                        ${course.individualPrice.toLocaleString('es-CO')}
                      </span>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>
        </div>

        {/* Course metadata */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* EN MOBILE: Ocultar badges aquí, ya están debajo de la portada */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2">
              <div className="hidden flex-wrap items-center gap-2 sm:flex">
                <Badge
                  variant="outline"
                  className="border-primary bg-background text-primary w-fit hover:bg-black/70"
                >
                  {course.category?.name}
                </Badge>
                {getCourseTypeLabel()}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Ocultar en pantallas pequeñas si no está logueado */}
              {isSignedIn ?? (
                <div className="hidden flex-col sm:flex sm:flex-row sm:items-center">
                  {/* ...existing code... */}
                  <div className="flex items-center">
                    <FaCalendar className="mr-2 text-white" />
                    <span className="text-xs text-white sm:text-sm">
                      Creado: {formatDateString(course.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="mr-2 text-white" />
                    <span className="text-xs text-white sm:text-sm">
                      Actualizado: {formatDateString(course.updatedAt)}
                    </span>
                  </div>
                </div>
              )}
              {/* Mostrar en desktop siempre */}
              {isSignedIn && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center">
                    <FaCalendar className="mr-2 text-white" />
                    <span className="text-xs text-white sm:text-sm">
                      Creado: {formatDateString(course.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="mr-2 text-white" />
                    <span className="text-xs text-white sm:text-sm">
                      Actualizado: {formatDateString(course.updatedAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Ocultar número de estudiantes en mobile si no está logueado */}
          {(isSignedIn ?? window.innerWidth >= 640) && (
            <div className="-mt-1 flex items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center sm:-mt-1">
                <FaUserGraduate className="mr-2 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600 sm:text-base">
                  {Math.max(0, totalStudents)}{' '}
                  {totalStudents === 1 ? 'Estudiante' : 'Estudiantes'}
                </span>
              </div>
              <div className="flex items-center sm:-mt-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon
                    key={index}
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      index < Math.floor(course.rating ?? 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-base font-semibold text-yellow-400 sm:text-lg">
                  {course.rating?.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Course type and instructor info */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full space-y-4">
            <div className="-mt-5 -mb-7 flex w-full items-center justify-between sm:-mt-1 sm:-mb-2">
              <div>
                <h3 className="text-base font-extrabold text-white sm:text-lg">
                  {/* Cambiado a blanco */}
                  {course.instructorName ?? 'Instructor no encontrado'}
                </h3>
                <em className="text-sm font-bold text-cyan-300 sm:text-base">
                  {/* Color brillante para "Educador" */}
                  Educador
                </em>
              </div>
              {/* Modalidad badge a la derecha en mobile, abajo en desktop */}
              <div className="mt-4 ml-2 block sm:hidden">
                <Badge className="bg-red-500 text-sm text-white hover:bg-red-700">
                  {course.modalidad?.name}
                </Badge>
              </div>
            </div>
          </div>
          {/* Modalidad badge solo visible en desktop */}
          <div className="hidden flex-col items-end gap-4 sm:flex">
            <Badge className="bg-red-500 text-sm text-white hover:bg-red-700">
              {course.modalidad?.name}
            </Badge>
          </div>
        </div>

        {/* New buttons container */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Grade button */}
          {/* Ocultar botón en mobile si no está logueado */}
        {(isSignedIn ?? window.innerWidth >= 640) && (
            <Button
              onClick={() => setIsGradeModalOpen(true)}
              disabled={!canAccessGrades}
              className={cn(
                'h-9 shrink-0 px-4 font-semibold sm:w-auto',
                canAccessGrades
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-400 text-white'
              )}
              aria-label={
                !isEnrolled
                  ? 'Debes inscribirte al curso'
                  : 'Completa todas las clases para ver tus calificaciones'
              }
            >
              <FaTrophy
                className={cn(
                  'mr-2 h-4 w-4',
                  !canAccessGrades ? 'text-black' : ''
                )}
              />
              <span
                className={cn(
                  'text-sm font-bold',
                  !canAccessGrades ? 'text-black' : ''
                )}
              >
                Mis Calificaciones
              </span>
            </Button>
          )}

          {/* Price button with space theme */}
          {course.courseTypeId === 4 &&
            course.individualPrice &&
            !isEnrolled && (
              <div className="flex flex-col items-center gap-4">
                <button onClick={handleEnrollClick} className="btn">
                  <strong>
                    <span>
                      ${' '}
                      {course.individualPrice.toLocaleString('es-CO', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span>Comprar Curso</span>
                  </strong>
                  <div id="container-stars">
                    <div id="stars" />
                  </div>
                  <div id="glow">
                    <div className="circle" />
                    <div className="circle" />
                  </div>
                </button>
              </div>
            )}
        </div>

        {/* --- NUEVO: Botón de compra individual arriba de la descripción --- */}
        {/* Pantallas grandes: mostrar arriba de la descripción y debajo de modalidad */}
        <div className="hidden sm:flex sm:justify-center sm:pt-2">
          {renderBuyButton()}
        </div>
        {/* Pantallas pequeñas: mostrar arriba de la descripción */}
        <div className="block pt-2 sm:hidden">{renderBuyButton()}</div>

        {/* Course description y botones responsivos */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="prose flex-1">
            <p className="text-justify text-sm leading-relaxed whitespace-pre-wrap text-white sm:text-base">
              {/* Cambiado a blanco */}
              {course.description ?? 'No hay descripción disponible.'}
            </p>
          </div>
          {/* Eliminar el botón de compra de aquí */}
        </div>

        {/* Botón de certificado con texto descriptivo */}
        {canAccessCertificate && (
          <div className="mt-6 space-y-4">
            <div className="relative mx-auto size-40">
              <Image
                src="/diploma-certificate.svg"
                alt="Certificado"
                fill
                className="transition-all duration-300 hover:scale-110"
              />
            </div>
            <p className="text-center font-serif text-lg text-gray-600 italic">
              ¡Felicitaciones! Has completado exitosamente el curso con una
              calificación sobresaliente. Tu certificado está listo para ser
              visualizado y compartido.
            </p>
            <Button
              asChild
              className="group relative w-full bg-green-500 p-0 text-white shadow-lg transition-all hover:bg-green-600"
            >
              <Link
                href={`/estudiantes/certificados/${course.id}`}
                className="relative flex h-full w-full items-center justify-center gap-2 overflow-hidden py-3"
              >
                {/* Fondo animado con opacidad ajustada */}
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-green-600/40 to-green-400/40" />

                {/* Contenido del botón */}
                <div className="relative z-10 flex items-center justify-center">
                  <span className="text-lg font-bold">Ver Tu Certificado</span>
                </div>
              </Link>
            </Button>
          </div>
        )}

        {/* Add Materias section below description */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-cyan-300">
            Materias asociadas:
          </h3>
          <div className="flex flex-wrap gap-2">
            {course.materias
              ? // Filter to only show unique materia titles
                Array.from(
                  new Map(
                    course.materias.map((materia) => [materia.title, materia])
                  ).values()
                ).map((materia: CourseMateria, index: number) => (
                  <Badge
                    key={materia.id}
                    variant="secondary"
                    className={`bg-gradient-to-r break-words whitespace-normal ${getBadgeGradient(index)} max-w-[200px] text-white transition-all duration-300 hover:scale-105 hover:shadow-lg sm:max-w-none`}
                  >
                    {materia.title}
                  </Badge>
                ))
              : null}
          </div>
        </div>

        {/* Course lessons */}
        <CourseContent
          course={course}
          isEnrolled={isEnrolled}
          isSubscriptionActive={isSubscriptionActive}
          subscriptionEndDate={subscriptionEndDate}
          isSignedIn={!!isSignedIn}
        />

        {/* --- Botón de compra individual en la parte inferior (como antes) --- */}
        {/* Eliminar la siguiente línea para evitar el botón duplicado en desktop */}
        {/* <div className="hidden pt-4 sm:flex sm:justify-center">
          {renderBuyButton()}
        </div> */}

        {/* Enrollment buttons with space theme */}
        <div className="flex justify-center pt-4">
          <div className="relative h-32">
            {localIsEnrolled ? (
              <div className="flex flex-col space-y-4">
                {/* Wrap both buttons in a fragment or a div */}
                <Button
                  className="bg-primary text-background hover:bg-primary/90 h-12 w-64 justify-center border-white/20 text-lg font-semibold transition-colors active:scale-95"
                  disabled
                >
                  <FaCheck className="mr-2" /> Suscrito Al Curso
                </Button>
                <Button
                  className="h-12 w-64 justify-center border-white/20 bg-red-500 text-lg font-semibold hover:bg-red-600"
                  onClick={onUnenrollAction}
                  disabled={isUnenrolling}
                >
                  {isUnenrolling ? (
                    <Icons.spinner
                      className="text-white"
                      style={{ width: '35px', height: '35px' }}
                    />
                  ) : (
                    'Cancelar Suscripción'
                  )}
                </Button>
              </div>
            ) : (
              <button
                className="btn"
                onClick={handleEnrollClick}
                disabled={isEnrolling || isEnrollClicked}
              >
                <strong>
                  {isEnrolling || isEnrollClicked ? (
                    <Icons.spinner className="h-6 w-6" />
                  ) : (
                    <>
                      {getButtonPrice() && <span>{getButtonPrice()}</span>}
                      <span>{getEnrollButtonText()}</span>
                    </>
                  )}
                </strong>
                <div id="container-stars">
                  <div id="stars" />
                </div>
                <div id="glow">
                  <div className="circle" />
                  <div className="circle" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Add GradeModal */}
        <GradeModal
          isOpen={isGradeModalOpen}
          onCloseAction={() => setIsGradeModalOpen(false)}
          courseTitle={course.title}
          courseId={course.id}
          userId={user?.id ?? ''} // Pass dynamic user ID
        />
      </CardContent>
      {showPaymentModal && (courseProduct ?? selectedProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-gray-800 p-4 text-white">
            {' '}
            {/* Cambiado a fondo oscuro */}
            <div className="relative mb-4 flex items-center justify-between">
              <h3 className="w-full text-center text-xl font-semibold text-white">
                Datos de Facturacion
                <br />
                <span className="font-bold">{course.title}</span>
              </h3>
              <button
                onClick={() => {
                  console.log('Closing payment modal');
                  setShowPaymentModal(false);
                }}
                className="absolute top-0 right-0 mt-2 mr-2 text-gray-300 hover:text-white"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <PaymentForm selectedProduct={selectedProduct ?? courseProduct!} />
          </div>
        </div>
      )}
    </Card>
  );
}
