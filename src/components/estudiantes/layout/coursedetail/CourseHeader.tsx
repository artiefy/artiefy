'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { SignInButton, useUser } from '@clerk/nextjs';
import { StarIcon } from '@heroicons/react/24/solid';
import {
  FaCalendar,
  FaCheck,
  FaClock,
  FaCrown,
  FaExpand,
  FaStar,
  FaUserGraduate,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';
import { IoGiftOutline } from 'react-icons/io5';
import { toast } from 'sonner';
import useSWR from 'swr';

import PaymentForm from '~/components/estudiantes/layout/PaymentForm'; // Agrega este import
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
import { type GradesApiResponse } from '~/lib/utils2';
import { isUserEnrolledInProgram } from '~/server/actions/estudiantes/programs/enrollInProgram';
import { createProductFromCourse } from '~/utils/paygateway/products';

import { CourseContent } from './CourseContent';

import type { ClassMeeting, Course, CourseMateria, Enrollment } from '~/types';

import '~/styles/certificadobutton.css';
import '~/styles/paybutton2.css';
import '~/styles/priceindividual.css';
import '~/styles/buttonforum.css';

export const revalidate = 3600;

interface ExtendedCourse extends Course {
  progress?: number;
  finalGrade?: number;
  forumId?: number;
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
  classMeetings?: ClassMeeting[];
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
  classMeetings = [],
}: CourseHeaderProps) {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [isLoadingGrade, setIsLoadingGrade] = useState(true);
  const [isEnrollClicked, setIsEnrollClicked] = useState(false);
  const [programToastShown, setProgramToastShown] = useState(false);
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

  // Modifica handleEnrollClick para solo usuarios autenticados
  const handleEnrollClick = async () => {
    if (!isSignedIn) {
      return;
    }

    setIsEnrollClicked(true);

    try {
      const userPlanType = user?.publicMetadata?.planType as string;
      const hasPremiumType = course.courseTypes?.some(
        (type) => type.requiredSubscriptionLevel === 'premium'
      );
      const hasProType = course.courseTypes?.some(
        (type) => type.requiredSubscriptionLevel === 'pro'
      );
      const isPurchasable =
        course.courseTypeId === 4 ||
        course.courseTypes?.some((type) => type.isPurchasableIndividually);

      // Si el curso es individual y el usuario no tiene suscripción activa, abrir el modal de pago
      if (
        isPurchasable &&
        (!isSubscriptionActive ||
          !(
            (userPlanType === 'Premium' && hasPremiumType) ||
            ((userPlanType === 'Pro' || userPlanType === 'Premium') &&
              hasProType)
          ))
      ) {
        setShowPaymentModal(true);
        setIsEnrollClicked(false);
        return;
      }

      // Si el curso requiere suscripción y el usuario no tiene suscripción activa, redirigir a /planes y no inscribir
      if (
        (hasPremiumType || hasProType) &&
        !isPurchasable &&
        !isSubscriptionActive
      ) {
        window.open('/planes', '_blank');
        setIsEnrollClicked(false);
        return;
      }

      // FIRST, CHECK IF USER CAN ACCESS VIA SUBSCRIPTION
      const userCanAccessWithSubscription =
        (userPlanType === 'Premium' && hasPremiumType) ??
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

      // Si el curso es gratuito o no requiere suscripción
      if (
        course.courseType?.requiredSubscriptionLevel === 'none' ||
        (!hasPremiumType && !hasProType)
      ) {
        await onEnrollAction();
        setLocalIsEnrolled(true);
        return;
      }

      // Fallback: si no cumple ninguna condición, redirigir a /planes
      window.open('/planes', '_blank');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al procesar la acción', {
        description: errorMessage,
      });
    } finally {
      setIsEnrollClicked(false);
    }
  };

  // Cambia el nombre de la función a getEnrollButtonText
  // Actualiza la lógica para mostrar el texto correcto según el estado de suscripción
  const getEnrollButtonText = (): string => {
    const userPlanType = user?.publicMetadata?.planType as string;
    const isPurchasableIndividually =
      course.courseTypeId === 4 ||
      course.courseTypes?.some((type) => type.isPurchasableIndividually);

    const hasPremiumType = course.courseTypes?.some(
      (type) => type.requiredSubscriptionLevel === 'premium'
    );
    const hasProType = course.courseTypes?.some(
      (type) => type.requiredSubscriptionLevel === 'pro'
    );
    const hasFreeType = course.courseTypes?.some(
      (type) =>
        type.requiredSubscriptionLevel === 'none' &&
        !type.isPurchasableIndividually
    );

    // Detectar si la suscripción está inactiva o vencida
    const subscriptionStatus = user?.publicMetadata
      ?.subscriptionStatus as string;
    const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
      | string
      | undefined;
    const isSubscriptionExpired =
      subscriptionStatus !== 'active' ||
      (subscriptionEndDate && new Date(subscriptionEndDate) < new Date());

    // Usar ?? en vez de ||
    const userCanAccessWithSubscription =
      (userPlanType === 'Premium' && hasPremiumType) ??
      ((userPlanType === 'Pro' || userPlanType === 'Premium') && hasProType);

    // --- NUEVO: Detectar si la inscripción es permanente (compra individual) ---
    // Busca en enrollments si hay isPermanent === true
    const isPermanentEnrollment =
      Array.isArray(course.enrollments) &&
      (course.enrollments as Enrollment[]).some(
        (enr) => enr.userId === user?.id && enr.isPermanent
      );

    // Si el usuario está inscrito y la inscripción es permanente (compra individual), mostrar siempre individual
    if (isEnrolled && isPermanentEnrollment) {
      return 'Inscrito al Curso Individual';
    }

    // Si el usuario está inscrito, mantener el texto según el tipo de inscripción original
    if (isEnrolled) {
      if (hasPremiumType && userPlanType === 'Premium')
        return 'Inscrito al Curso Premium';
      if (hasProType && userPlanType === 'Pro') return 'Inscrito al Curso Pro';
      if (hasFreeType) return 'Inscribto al Curso Gratis';
      if (isPurchasableIndividually) return 'Inscrito al Curso Individual';
      return 'Inscrito al Curso';
    }

    // Si el curso es individual y el usuario no tiene acceso por suscripción activa, mostrar "Comprar Curso"
    if (
      isPurchasableIndividually &&
      (!userCanAccessWithSubscription || isSubscriptionExpired)
    ) {
      const price =
        course.individualPrice ??
        course.courseTypes?.find((type) => type.isPurchasableIndividually)
          ?.price ??
        0;
      return `Comprar Curso $${price.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    }

    // Si el usuario no está autenticado
    if (!isSignedIn) {
      if (course.courseTypes && course.courseTypes.length > 0) {
        if (hasPremiumType) return 'Inscribirse al Curso Premium';
        if (hasProType) return 'Inscribirse al Curso Pro';
        if (hasFreeType) return 'Inscribirse al Curso Gratis';
      }
      if (course.courseType) {
        if (course.courseType.requiredSubscriptionLevel === 'premium')
          return 'Inscribirse al Curso Premium';
        if (course.courseType.requiredSubscriptionLevel === 'pro')
          return 'Inscribirse al Curso Pro';
        if (course.courseType.requiredSubscriptionLevel === 'none')
          return 'Inscribirse al Curso Gratis';
      }
      return 'Iniciar Sesión';
    }

    // Si el curso es gratuito
    if (
      course.courseType?.requiredSubscriptionLevel === 'none' ||
      hasFreeType
    ) {
      return 'Inscribirse al Curso Gratis';
    }

    // Si el usuario tiene suscripción activa y acceso
    if (isSignedIn && isSubscriptionActive && userCanAccessWithSubscription) {
      if (hasPremiumType) return 'Inscribirse al Curso Premium';
      if (hasProType) return 'Inscribirse al Curso Pro';
      return 'Inscribirse al Curso';
    }

    // Si el usuario no tiene suscripción activa y el curso es premium/pro
    if (!isSubscriptionActive && (hasPremiumType || hasProType)) {
      if (hasPremiumType) return 'Inscribirse al Curso Premium';
      if (hasProType) return 'Inscribirse al Curso Pro';
    }

    // Fallback
    if (course.courseTypes && course.courseTypes.length > 0) {
      if (hasPremiumType && !hasProType) return 'Inscribirse al Curso Premium';
      if (hasProType && !hasPremiumType) return 'Inscribirse al Curso Pro';
    }
    if (course.courseType) {
      if (course.courseType.requiredSubscriptionLevel === 'premium')
        return 'Inscribirse al Curso Premium';
      if (course.courseType.requiredSubscriptionLevel === 'pro')
        return 'Inscribirse al Curso Pro';
    }
    return 'Inscribirse al Curso';
  };

  const getButtonPrice = (): string | null => {
    // No mostrar el precio por separado, solo en el texto del botón
    return null;
  };

  const handlePlanBadgeClick = () => {
    window.open('/planes', '_blank', 'noopener,noreferrer');
  };

  // Update local enrollment status when the prop changes
  useEffect(() => {
    setLocalIsEnrolled(isEnrolled);
  }, [isEnrolled]);

  // --- Botón de inscripción/cancelación arriba de la descripción ---
  // Reubica el bloque de inscripción aquí, elimina los duplicados
  const renderTopEnrollmentButton = () => {
    if (localIsEnrolled) {
      return (
        <div className="mb-0 flex justify-center pt-0 pb-2 sm:mb-0 sm:justify-center sm:pt-0">
          <div className="flex w-full flex-col items-center sm:w-auto sm:items-center sm:justify-center">
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
        </div>
      );
    }
    // Si NO está inscrito, muestra solo el botón y elimina el espacio extra
    return (
      <div className="mb-2 flex justify-center pt-0 sm:mb-2 sm:justify-center sm:pt-0">
        <div className="flex w-full items-center justify-center sm:w-auto sm:justify-center">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="btn">
                <strong>
                  {/* Elimina el precio aquí */}
                  <span>{getEnrollButtonText()}</span>
                </strong>
                <div id="container-stars">
                  <div id="stars" />
                </div>
                <div id="glow">
                  <div className="circle" />
                  <div className="circle" />
                </div>
              </button>
            </SignInButton>
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
                    {/* Elimina el precio aquí */}
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
    );
  };

  // --- NUEVO: Estado para forumId ---
  const [forumId, setForumId] = useState<number | null>(null);

  // --- NUEVO: Obtener forumId por curso ---
  useEffect(() => {
    const fetchForum = async () => {
      try {
        const res = await fetch(
          `/api/estudiantes/forums/by-course?courseId=${course.id}`
        );
        if (res.ok) {
          const data = (await res.json()) as { id?: number } | null;
          if (data && typeof data.id === 'number') setForumId(data.id);
        }
      } catch {
        // No hacer nada si no hay foro
      }
    };
    fetchForum();
  }, [course.id]);

  // Estado para mostrar el modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // --- Fix: define coverImageKey and coverVideoCourseKey at the top ---
  const coverImageKey = course.coverImageKey;
  const coverVideoCourseKey =
    typeof course === 'object' && 'coverVideoCourseKey' in course
      ? (course as { coverVideoCourseKey?: string }).coverVideoCourseKey
      : undefined;

  // --- Fix: define videoVolume and isMuted state ---
  const [videoVolume, setVideoVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);

  // --- Fix: define courseProduct for modal ---
  const courseProduct = useMemo(() => {
    if (course.courseTypeId === 4 && course.individualPrice != null) {
      return createProductFromCourse(course);
    }
    const purchasableType = course.courseTypes?.find(
      (type) => type.isPurchasableIndividually
    );
    // Usar ?? en vez de ternario para prefer-nullish-coalescing
    const price = course.individualPrice ?? purchasableType?.price ?? null;
    if (purchasableType && price != null) {
      return createProductFromCourse({
        ...course,
        individualPrice: price,
      });
    }
    return null;
  }, [course]);

  // --- Fix: define handleVolumeChange and handleToggleMute ---
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

  const handleToggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
        if (videoRef.current.volume === 0) {
          setVideoVolume(1);
          videoRef.current.volume = 1;
        }
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {
            // purposely empty: autoplay fallback
          });
        }
      } else {
        setIsMuted(true);
        videoRef.current.muted = true;
      }
    }
  };

  // Debug logs
  useEffect(() => {
    console.log('CourseHeader Debug:', {
      courseId: course.id,
      userId: user?.id,
      isEnrolled,
      isSubscriptionActive,
      subscriptionEndDate,
      currentFinalGrade,
      gradesData,
      gradesError: gradesError?.message,
      localIsEnrolled,
      programToastShown,
    });
  }, [
    course.id,
    user?.id,
    isEnrolled,
    isSubscriptionActive,
    subscriptionEndDate,
    currentFinalGrade,
    gradesData,
    gradesError,
    localIsEnrolled,
    programToastShown,
  ]);

  return (
    <>
      <Card className="overflow-hidden bg-gray-800 p-0 text-white">
        {/* Cambia el CardHeader para reducir el espacio en móviles */}
        <CardHeader className="mt-0 px-0 py-2 pt-0 sm:mt-0 sm:py-6 sm:pt-0">
          <div className="relative mt-0 mb-4 w-full pt-0 transition-all duration-200 sm:mt-0 sm:pt-0">
            <AspectRatio
              ratio={16 / 9}
              className="mt-0 w-full pt-0 sm:mt-0 sm:pt-0"
            >
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
        <CardContent className="mx-auto mt-0 w-full max-w-7xl space-y-4 px-4 pt-0 sm:mt-0 sm:px-6 sm:pt-0">
          {' '}
          {/* <-- Ensure no top margin/padding */}
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
                      mainIcon = (
                        <FaCrown className="text-xs text-purple-500" />
                      );
                      mainColor = 'text-purple-500';
                    } else if (hasPro) {
                      mainType = 'PRO';
                      mainIcon = (
                        <FaCrown className="text-xs text-orange-500" />
                      );
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
          <div className="mb-6 flex flex-col gap-4 sm:-mb-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="w-full space-y-4">
              <div className="-mt-5 -mb-7 flex w-full items-center justify-between sm:-mt-1 sm:-mb-2">
                <div className="flex w-full items-center">
                  <div>
                    <h3 className="text-base font-extrabold text-white sm:text-lg">
                      {course.instructorName ?? 'Instructor no encontrado'}
                    </h3>
                    <em className="text-sm font-bold text-cyan-300 sm:text-base">
                      Educador
                    </em>
                  </div>
                </div>
              </div>
              {/* Botón foro SOLO en mobile, debajo de "Educador" y centrado */}
              {isEnrolled && (forumId ?? course.forumId) && (
                <div className="mt-8 -mb-6 flex w-full justify-center sm:hidden">
                  <Link href={`/estudiantes/foro/${forumId ?? course.forumId}`}>
                    <button
                      className="buttonforum text-secondary w-full max-w-xs text-base font-bold whitespace-nowrap sm:max-w-md sm:text-lg md:max-w-lg lg:max-w-xl xl:max-w-2xl"
                      style={{ minWidth: 240 }}
                    >
                      Ir al Foro Del Curso
                    </button>
                  </Link>
                </div>
              )}
            </div>
            {/* Modalidad badge solo visible en desktop */}
            <div className="hidden flex-col items-end gap-4 sm:flex">
              <Badge className="bg-red-500 text-sm text-white hover:bg-red-700">
                {course.modalidad?.name}
              </Badge>
              {/* Botón foro SOLO aquí, alineado a la derecha y abajo de la modalidad */}
              {isEnrolled &&
                (forumId || course.forumId ? (
                  <div className="mt-2 flex w-full justify-end">
                    <Link
                      href={`/estudiantes/foro/${forumId ?? course.forumId}`}
                    >
                      <button
                        className="buttonforum text-secondary w-full max-w-xs text-base font-bold whitespace-nowrap sm:max-w-md sm:text-lg md:max-w-lg lg:max-w-xl xl:max-w-2xl"
                        style={{ minWidth: 240 }}
                      >
                        Ir al Foro Del Curso
                      </button>
                    </Link>
                  </div>
                ) : null)}
            </div>
          </div>
          {/* New buttons container */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Grade button */}
            {/* Ocultar botón en mobile si no está logueado */}
            {/* 
            {(isSignedIn ?? window.innerWidth >= 640) && (
              <Button
                onClick={() => setIsGradeModalOpen(true)}
                disabled={!canAccessGrades}
                className={cn(
                  'mt-6 h-9 shrink-0 px-4 font-semibold sm:w-auto', // <-- aumenta el mt aquí
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
            */}
            {/* Price button with space theme */}
            {course.courseTypeId === 4 &&
              course.individualPrice &&
              !isEnrolled && (
                <div className="flex flex-col items-center gap-4">
                  {!isSignedIn ? (
                    <SignInButton mode="modal">
                      <button className="btn">
                        <strong>
                          {/* Solo mostrar el texto con precio */}
                          <span>
                            {`Comprar Curso $${course.individualPrice.toLocaleString(
                              'es-CO',
                              {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }
                            )}`}
                          </span>
                        </strong>
                        <div id="container-stars">
                          <div id="stars" />
                        </div>
                        <div id="glow">
                          <div className="circle" />
                          <div className="circle" />
                        </div>
                      </button>
                    </SignInButton>
                  ) : (
                    <button onClick={handleEnrollClick} className="btn">
                      <strong>
                        <span>
                          {`Comprar Curso $${course.individualPrice.toLocaleString(
                            'es-CO',
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }
                          )}`}
                        </span>
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
              )}
          </div>
          {renderTopEnrollmentButton()}
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
              <p className="text-center font-serif text-lg text-yellow-500 italic">
                ¡Felicitaciones! Has completado exitosamente el curso con una
                calificación sobresaliente. Tu certificado está listo para ser
                visualizado y compartido.
              </p>
              <div className="flex justify-center">
                <Link href={`/estudiantes/certificados/${course.id}`}>
                  <button className="certificacion relative mx-auto text-base font-bold">
                    <span className="relative z-10">Ver Tu Certificado</span>
                  </button>
                </Link>
              </div>
            </div>
          )}
          {/* Add Materias section below description */}
          {course.materias && course.materias.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-300">
                Materias asociadas:
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Filter to only show unique materia titles */}
                {Array.from(
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
                ))}
              </div>
            </div>
          )}
          {/* Course lessons */}
          <CourseContent
            course={course}
            isEnrolled={isEnrolled}
            isSubscriptionActive={isSubscriptionActive}
            subscriptionEndDate={subscriptionEndDate}
            isSignedIn={!!isSignedIn}
            classMeetings={classMeetings} // <-- Pasa classMeetings aquí
          />
          {/* --- Botón de inscripción/cancelación abajo como antes --- */}
          <div className="flex justify-center pt-4">
            <div className="relative h-32">
              {localIsEnrolled ? (
                <div className="flex flex-col space-y-4">
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
        </CardContent>
      </Card>
      {/* --- MODAL DE PAGO PARA CURSO INDIVIDUAL --- */}
      {showPaymentModal && courseProduct && (
        <div className="pointer-events-auto fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-4">
            <div className="relative mb-4 flex items-center justify-between">
              <h3 className="w-full text-center text-xl font-semibold text-gray-900">
                Llena este formulario
                <br />
                <span className="font-bold">{courseProduct.name}</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-0 right-0 z-[1010] mt-2 mr-2 text-gray-500 hover:text-gray-700"
                type="button"
              >
                ×
              </button>
            </div>
            <div>
              <PaymentForm
                selectedProduct={courseProduct}
                requireAuthOnSubmit={!isSignedIn}
                redirectUrlOnAuth={`/estudiantes/cursos/${course.id}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
