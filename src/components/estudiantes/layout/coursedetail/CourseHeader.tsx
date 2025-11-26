'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import {
  usePathname,
  useRouter as useNextRouter,
  useSearchParams,
} from 'next/navigation';

import { SignInButton, useSignUp, useUser } from '@clerk/nextjs';
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid';
import {
  FaCalendar,
  FaCheck,
  FaClock,
  FaCrown,
  FaExpand,
  FaStar,
  FaTimes,
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
import generateUsername from '~/utils/generateUsername';
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
  const { signUp } = useSignUp();
  const router = useNextRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isLoadingGrade, setIsLoadingGrade] = useState(true);
  const [isEnrollClicked, setIsEnrollClicked] = useState(false);
  const [programToastShown, setProgramToastShown] = useState(false);
  const [localIsEnrolled, setLocalIsEnrolled] = useState(isEnrolled);

  // Determina si el curso es comprable individualmente (tipo compra)
  const isPurchasable =
    course.courseTypeId === 4 ||
    !!course.courseTypes?.some((type) => type.isPurchasableIndividually) ||
    !!course.courseType?.isPurchasableIndividually;

  // URL de redirección para Clerk: sólo añadir ?comprar=1 para cursos comprables
  const forceRedirectUrl = isPurchasable ? `${pathname}?comprar=1` : pathname;

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

  // Add new effect to check program enrollment
  useEffect(() => {
    // Keep a non-blocking advisory for program-associated courses.
    // IMPORTANT: no redirect or enrollment blocking — users must be
    // able to enroll even if they are not enrolled in the program.
    const checkProgramEnrollment = async () => {
      const programMateria = course.materias?.find(
        (materia) => materia.programaId !== null
      );

      if (programMateria?.programaId && user?.id && !isEnrolled) {
        try {
          // If course has both PRO and PREMIUM types, nothing special to do
          const hasPremiumType = course.courseTypes?.some(
            (type) => type.requiredSubscriptionLevel === 'premium'
          );
          const hasProType = course.courseTypes?.some(
            (type) => type.requiredSubscriptionLevel === 'pro'
          );

          if (hasPremiumType && hasProType) return;

          // Check program enrollment only to inform the user. Do NOT block.
          const isProgramEnrolled = await isUserEnrolledInProgram(
            programMateria.programaId,
            user.id
          );

          if (!isProgramEnrolled && !programToastShown) {
            setProgramToastShown(true);
            // Informational (non-blocking) notice — no redirect
            toast(
              'Este curso está asociado a un programa. No es necesario estar inscrito en el programa para inscribirte en el curso.',
              {
                id: `program-info-${programMateria.programaId}`,
                duration: 6000,
              }
            );
          }
        } catch (error) {
          console.error('Error checking program enrollment:', error);
        }
      }
    };

    void checkProgramEnrollment();
  }, [
    course.materias,
    course.courseTypes,
    user?.id,
    isEnrolled,
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
      // Guardar flag para autoabrir modal tras login
      if (
        course.courseTypeId === 4 ||
        course.courseTypes?.some((type) => type.isPurchasableIndividually)
      ) {
        sessionStorage.setItem('openPaymentModalAfterLogin', '1');
      }
      // El modal de login se abre automáticamente por <SignInButton>
      return;
    }

    setIsEnrollClicked(true);

    try {
      const userPlanType = user?.publicMetadata?.planType as string;
      // Unificar detección cuando sólo existe course.courseType (estructura legacy)
      const singleType = !course.courseTypes?.length
        ? course.courseType
        : undefined;
      let hasPremiumType = false;
      if (
        course.courseTypes?.some(
          (type) => type.requiredSubscriptionLevel === 'premium'
        )
      ) {
        hasPremiumType = true;
      } else if (singleType?.requiredSubscriptionLevel === 'premium') {
        hasPremiumType = true;
      }
      let hasProType = false;
      if (
        course.courseTypes?.some(
          (type) => type.requiredSubscriptionLevel === 'pro'
        )
      ) {
        hasProType = true;
      } else if (singleType?.requiredSubscriptionLevel === 'pro') {
        hasProType = true;
      }
      let isPurchasable = false;
      if (course.courseTypeId === 4) {
        isPurchasable = true;
      } else if (
        course.courseTypes?.some((type) => type.isPurchasableIndividually)
      ) {
        isPurchasable = true;
      } else if (singleType?.isPurchasableIndividually) {
        isPurchasable = true;
      }

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
        openPaymentModalFlow();
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
      // Corregir lógica: Premium debe poder acceder a Pro; evitar uso incorrecto de ?? que bloqueaba acceso
      let userCanAccessWithSubscription = false;
      if (userPlanType === 'Premium' && hasPremiumType) {
        userCanAccessWithSubscription = true;
      } else if (
        (userPlanType === 'Pro' || userPlanType === 'Premium') &&
        hasProType
      ) {
        userCanAccessWithSubscription = true;
      }

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

              if (!isProgramEnrolled && !programToastShown) {
                // Inform the user but DO NOT block enrollment or redirect
                setProgramToastShown(true);
                toast(
                  `Este curso está asociado al programa "${programMateria.programa?.title}". No necesitas estar inscrito al programa para inscribirte al curso.`,
                  {
                    duration: 5000,
                    id: `program-enroll-advice-${programMateria.programaId}`,
                  }
                );
              }
            }
          } catch (error) {
            console.error('Error checking program enrollment:', error);
            // Don't block enrollment on error; just notify
            if (!programToastShown) {
              setProgramToastShown(true);
              toast.error(
                'Error al verificar la inscripción al programa (no bloqueante)'
              );
            }
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
    let isPurchasableIndividually = false;
    if (course.courseTypeId === 4) {
      isPurchasableIndividually = true;
    } else if (
      course.courseTypes?.some((type) => type.isPurchasableIndividually)
    ) {
      isPurchasableIndividually = true;
    } else if (course.courseType?.isPurchasableIndividually) {
      isPurchasableIndividually = true;
    }

    const singleType = !course.courseTypes?.length
      ? course.courseType
      : undefined;
    let hasPremiumType = false;
    if (
      course.courseTypes?.some(
        (type) => type.requiredSubscriptionLevel === 'premium'
      )
    ) {
      hasPremiumType = true;
    } else if (singleType?.requiredSubscriptionLevel === 'premium') {
      hasPremiumType = true;
    }
    let hasProType = false;
    if (
      course.courseTypes?.some(
        (type) => type.requiredSubscriptionLevel === 'pro'
      )
    ) {
      hasProType = true;
    } else if (singleType?.requiredSubscriptionLevel === 'pro') {
      hasProType = true;
    }
    let hasFreeType = false;
    if (
      course.courseTypes?.some(
        (type) =>
          type.requiredSubscriptionLevel === 'none' &&
          !type.isPurchasableIndividually
      )
    ) {
      hasFreeType = true;
    } else if (
      singleType?.requiredSubscriptionLevel === 'none' &&
      !singleType?.isPurchasableIndividually
    ) {
      hasFreeType = true;
    }

    // Detectar si la suscripción está inactiva o vencida
    const subscriptionStatus = user?.publicMetadata
      ?.subscriptionStatus as string;
    const subscriptionEndDate = user?.publicMetadata?.subscriptionEndDate as
      | string
      | undefined;
    const isSubscriptionExpired =
      subscriptionStatus !== 'active' ||
      (subscriptionEndDate && new Date(subscriptionEndDate) < new Date());

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
      if (hasFreeType) return 'Inscrito al Curso Gratis';
      if (isPurchasableIndividually) return 'Inscrito al Curso Individual';
      return 'Inscrito al Curso';
    }

    // PRIORIDAD 1: Si el usuario tiene suscripción activa, mostrar según su plan
    if (isSignedIn && isSubscriptionActive && !isSubscriptionExpired) {
      // Usuario con Premium activo y curso tiene tipo Premium
      if (userPlanType === 'Premium' && hasPremiumType) {
        return 'Inscribirse al Curso Premium';
      }
      // Usuario con Pro o Premium activo y curso tiene tipo Pro
      if (
        (userPlanType === 'Pro' || userPlanType === 'Premium') &&
        hasProType
      ) {
        return 'Inscribirse al Curso Pro';
      }
    }

    // PRIORIDAD 2: Si no tiene suscripción activa Y el curso es individual, mostrar compra
    if (
      isPurchasableIndividually &&
      (!isSubscriptionActive || isSubscriptionExpired)
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

    // PRIORIDAD 3: Si el usuario no está autenticado, mostrar según tipos disponibles
    if (!isSignedIn) {
      if (course.courseTypes && course.courseTypes.length > 0) {
        // Orden de prioridad: Individual > Premium > Pro > Free
        if (isPurchasableIndividually) {
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

    // PRIORIDAD 4: Si el curso es SOLO gratuito (sin otros tipos)
    if (
      hasFreeType &&
      !isPurchasableIndividually &&
      !hasPremiumType &&
      !hasProType
    ) {
      return 'Inscribirse al Curso Gratis';
    }

    // PRIORIDAD 5: Si no tiene suscripción activa, mostrar tipo predominante
    if (!isSubscriptionActive || isSubscriptionExpired) {
      if (isPurchasableIndividually) {
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
      if (hasPremiumType) return 'Inscribirse al Curso Premium';
      if (hasProType) return 'Inscribirse al Curso Pro';
      if (hasFreeType) return 'Inscribirse al Curso Gratis';
    }

    // Fallback final
    if (hasPremiumType) return 'Inscribirse al Curso Premium';
    if (hasProType) return 'Inscribirse al Curso Pro';
    if (hasFreeType) return 'Inscribirse al Curso Gratis';
    if (isPurchasableIndividually) {
      const price =
        course.individualPrice ??
        course.courseTypes?.find((type) => type.isPurchasableIndividually)
          ?.price ??
        singleType?.price ??
        0;
      return `Comprar Curso $${price.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
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
  const [autoPaymentTriggered, setAutoPaymentTriggered] = useState(false);

  // --- NUEVO: función para abrir el modal de pago tras login ---
  const openPaymentModalFlow = () => {
    setShowPaymentModal(true);
  };

  // NUEVO: Abrir modal automáticamente tras login si hay ?comprar=1 en la URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasComprarParam = searchParams?.get('comprar') === '1';
    let hasEnrollFlag = false;
    try {
      hasEnrollFlag =
        sessionStorage.getItem('enrollAfterLogin') === '1' ||
        sessionStorage.getItem('openPaymentModalAfterLogin') === '1';
    } catch {
      hasEnrollFlag = false;
    }

    if (
      isSignedIn &&
      !autoPaymentTriggered &&
      !isEnrolled &&
      (hasComprarParam || hasEnrollFlag)
    ) {
      setAutoPaymentTriggered(true);

      // If we have the comprar param, remove it from the URL to avoid reruns
      if (hasComprarParam) {
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.delete('comprar');
        const newUrl =
          pathname + (params.toString() ? `?${params.toString()}` : '');
        router.replace(newUrl);
      }

      // Clear session flags (non-blocking)
      try {
        sessionStorage.removeItem('enrollAfterLogin');
        sessionStorage.removeItem('openPaymentModalAfterLogin');
      } catch {
        // ignore
      }

      // Esperar un momento para que cualquier estado de suscripción en el padre
      // (CourseDetails) se sincronice tras el login, luego intentar inscribirse.
      void (async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        void handleEnrollClick();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isEnrolled, searchParams, pathname]);

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
                (() => {
                  // Validar si el archivo es imagen o video
                  const ext = coverVideoCourseKey
                    .split('.')
                    .pop()
                    ?.toLowerCase();
                  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(
                    ext ?? ''
                  );
                  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(
                    ext ?? ''
                  );

                  if (isImage) {
                    return (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverVideoCourseKey}`.trimEnd()}
                        alt={course.title}
                        fill
                        className="min-h-[180px] object-cover sm:min-h-[340px] md:min-h-[400px] lg:min-h-[480px]"
                        priority
                        sizes="100vw"
                        placeholder="blur"
                        blurDataURL={blurDataURL}
                      />
                    );
                  }
                  if (isVideo) {
                    return (
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
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            imageRendering: 'auto',
                          }}
                        />
                        {/* Botón de volumen y pantalla completa */}
                        <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2 sm:right-4 sm:bottom-4">
                          {/* Botón mute/unmute */}
                          <button
                            type="button"
                            aria-label={
                              isMuted ? 'Activar sonido' : 'Silenciar'
                            }
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
                    );
                  }
                  // Si no es imagen ni video, fallback a imagen de portada
                  return (
                    <Image
                      src={
                        coverImageKey
                          ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`.trimEnd()
                          : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
                      }
                      alt={course.title}
                      fill
                      className="min-h-[180px] object-cover sm:min-h-[340px] md:min-h-[400px] lg:min-h-[480px]"
                      priority
                      sizes="100vw"
                      placeholder="blur"
                      blurDataURL={blurDataURL}
                    />
                  );
                })()
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
            {/* Título en móviles - con chulito alineado a última palabra */}
            <h1 className="-mt-10 mb-2 line-clamp-2 text-lg font-bold text-cyan-300 sm:hidden">
              <span className="inline">
                {course.title}{' '}
                {isEnrolled && (
                  <CheckCircleIcon className="mb-1 ml-1 inline-block h-5 w-5 flex-shrink-0 align-middle text-green-500" />
                )}
              </span>
            </h1>

            {/* Título en desktop - adjusted top margin */}
            <h1 className="mb-2 line-clamp-2 hidden text-xl font-bold text-cyan-300 sm:-mt-12 sm:flex sm:items-center md:text-2xl lg:text-3xl">
              {course.title}
              {isEnrolled && (
                <CheckCircleIcon className="ml-3 h-6 w-6 flex-shrink-0 text-green-500" />
              )}
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
              {/* Fechas: ocultas en pantallas pequeñas si NO está inscrito; en sm+ siempre visibles */}
              <div
                className={`${isEnrolled ? 'flex' : 'hidden sm:flex'} flex-col gap-2 sm:flex-row sm:items-center`}
              >
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
              <div className="-mt-3 -mb-9 flex w-full items-center justify-between sm:-mt-1 sm:-mb-2">
                <div className="flex w-full items-center">
                  <div>
                    <h3 className="text-base font-extrabold text-white sm:text-lg">
                      {course.instructorName ?? 'Instructor no encontrado'}
                    </h3>
                    <em className="mb-4 block text-sm font-bold text-cyan-300 sm:text-base">
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
          {/* Duplicated enrollment button (centered) - mirror the bottom control exactly for consistent visuals */}
          <div
            className={`flex justify-center ${localIsEnrolled ? 'mb-4' : 'mb-2'}`}
          >
            {/* Escala completa más pequeña en pantallas móviles, restaurada en sm+ */}
            <div className="relative h-auto origin-center scale-90 transform-gpu sm:scale-100">
              {localIsEnrolled ? (
                <div className="flex flex-col items-center space-y-2">
                  <Button
                    className="bg-primary text-background hover:bg-primary/90 h-10 w-56 justify-center border-white/20 text-sm font-semibold transition-colors active:scale-95 sm:h-12 sm:w-64 sm:text-lg"
                    disabled
                  >
                    <FaCheck className="mr-2" /> Suscrito Al Curso
                  </Button>
                  <Button
                    className="h-10 w-56 justify-center border-white/20 bg-red-500 text-sm font-semibold hover:bg-red-600 sm:h-12 sm:w-64 sm:text-lg"
                    onClick={onUnenrollAction}
                    disabled={isUnenrolling}
                  >
                    {isUnenrolling ? (
                      <Icons.spinner
                        className="text-white"
                        style={{ width: '28px', height: '28px' }}
                      />
                    ) : (
                      'Cancelar Suscripción'
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  {!isSignedIn ? (
                    <SignInButton
                      mode="modal"
                      forceRedirectUrl={forceRedirectUrl}
                    >
                      <button
                        className="btn h-10 w-56 sm:h-12 sm:w-64"
                        onClick={async () => {
                          try {
                            const suggested = String(
                              sessionStorage.getItem(
                                'clerkSuggestedUsername'
                              ) ?? generateUsername()
                            );
                            try {
                              sessionStorage.setItem(
                                'clerkSuggestedUsername',
                                suggested
                              );
                            } catch {
                              // ignore storage errors
                            }

                            if (isPurchasable) {
                              sessionStorage.setItem(
                                'openPaymentModalAfterLogin',
                                '1'
                              );
                            } else {
                              sessionStorage.setItem('enrollAfterLogin', '1');
                            }

                            if (signUp) {
                              const maybeCreate = (
                                signUp as unknown as {
                                  create?: (p: {
                                    username?: string;
                                  }) => Promise<unknown>;
                                }
                              ).create;
                              if (typeof maybeCreate === 'function') {
                                try {
                                  await maybeCreate({ username: suggested });
                                } catch (e) {
                                  console.warn('signUp.create failed', e);
                                }
                              }
                            }
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        <strong className="text-sm sm:text-lg">
                          {getButtonPrice() && <span>{getButtonPrice()}</span>}
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
                      className="btn h-10 w-56 sm:h-12 sm:w-64"
                      onClick={handleEnrollClick}
                      disabled={isEnrolling || isEnrollClicked}
                    >
                      <strong className="text-sm sm:text-lg">
                        {isEnrolling || isEnrollClicked ? (
                          <Icons.spinner className="h-5 w-5" />
                        ) : (
                          <>
                            {getButtonPrice() && (
                              <span>{getButtonPrice()}</span>
                            )}
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
                </>
              )}
            </div>
          </div>
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
                <>
                  {!isSignedIn ? (
                    <SignInButton
                      mode="modal"
                      forceRedirectUrl={forceRedirectUrl}
                    >
                      <button
                        className="btn"
                        onClick={async () => {
                          try {
                            const suggested = String(
                              sessionStorage.getItem(
                                'clerkSuggestedUsername'
                              ) ?? generateUsername()
                            );
                            try {
                              sessionStorage.setItem(
                                'clerkSuggestedUsername',
                                suggested
                              );
                            } catch {
                              // ignore storage errors
                            }

                            if (isPurchasable) {
                              sessionStorage.setItem(
                                'openPaymentModalAfterLogin',
                                '1'
                              );
                            } else {
                              sessionStorage.setItem('enrollAfterLogin', '1');
                            }

                            if (signUp) {
                              const maybeCreate = (
                                signUp as unknown as {
                                  create?: (p: {
                                    username?: string;
                                  }) => Promise<unknown>;
                                }
                              ).create;
                              if (typeof maybeCreate === 'function') {
                                try {
                                  await maybeCreate({ username: suggested });
                                } catch (e) {
                                  console.warn('signUp.create failed', e);
                                }
                              }
                            }
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        <strong>
                          {getButtonPrice() && <span>{getButtonPrice()}</span>}
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
                            {getButtonPrice() && (
                              <span>{getButtonPrice()}</span>
                            )}
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
                </>
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
                aria-label="Cerrar"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div>
              <PaymentForm
                selectedProduct={courseProduct}
                requireAuthOnSubmit={!isSignedIn}
                redirectUrlOnAuth={`/estudiantes/cursos/${course.id}`}
                // No necesitas onAutoOpenModal aquí, el efecto ya lo maneja
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
