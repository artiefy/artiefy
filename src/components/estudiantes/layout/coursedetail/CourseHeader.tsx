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
  const { user, isSignedIn } = useUser(); // Add isSignedIn here
  const router = useRouter();
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isLoadingGrade, setIsLoadingGrade] = useState(true);
  const [isEnrollClicked, setIsEnrollClicked] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Add a new state to track if program enrollment toast has been shown
  const [programToastShown, setProgramToastShown] = useState(false);

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
  }, [course.materias, user?.id, isEnrolled, router, programToastShown]);

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
      userPlanType === 'Pro' || userPlanType === 'Premium';

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

      // Si el usuario no tiene suscripción, mostrar según prioridad
      if (!hasActiveSubscription) {
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
                  $
                  {course.individualPrice?.toLocaleString() ??
                    purchasableType?.price?.toLocaleString() ??
                    'Comprar'}
                </span>
              </div>
              {includedInPlans.length > 0 && (
                <>
                  {/* Mobile view */}
                  <div className="block text-xs text-gray-300 italic sm:hidden">
                    Incluido en: {includedInPlans.join(', ')}
                  </div>
                  {/* Desktop view as badge */}
                  <div className="hidden sm:block">
                    <Badge className="bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500">
                      Incluido en: {includedInPlans.join(', ')}
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
                  <div className="block text-xs text-gray-300 italic sm:hidden">
                    Incluido en: {otherPlans.join(', ')}
                  </div>
                  {/* Desktop view as badge */}
                  <div className="hidden sm:block">
                    <Badge className="bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500">
                      Incluido en: {otherPlans.join(', ')}
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
                  <div className="block text-xs text-gray-300 italic sm:hidden">
                    Incluido en: {otherPlans.join(', ')}
                  </div>
                  {/* Desktop view as badge */}
                  <div className="hidden sm:block">
                    <Badge className="bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500">
                      Incluido en: {otherPlans.join(', ')}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          );
        }
      } else {
        // Para usuarios con suscripción, mantener la lógica existente
        // ...existing code for users with subscription...
      }

      // Para cursos gratuitos (visible para todos)
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
                <div className="block text-xs text-gray-300 italic sm:hidden">
                  Incluido en: {otherPlans.join(', ')}
                </div>
                {/* Desktop view as badge */}
                <div className="hidden sm:block">
                  <Badge className="bg-yellow-400 text-xs text-gray-900 hover:bg-yellow-500">
                    Incluido en: {otherPlans.join(', ')}
                  </Badge>
                </div>
              </>
            )}
          </div>
        );
      }
    }

    // Fallback a la lógica original para compatibilidad
    // ...existing code...
  };

  const handleEnrollClick = async () => {
    if (!isSignedIn) {
      // Store purchase intent in localStorage before redirecting
      if (course.courseTypeId === 4) {
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

    setIsEnrollClicked(true);

    try {
      const userPlanType = user?.publicMetadata?.planType as string;

      // Determine el tipo de curso más adecuado para este usuario
      let requiresPayment = false;
      let isPremiumRequired = false;
      let requiresUpgrade = false;

      if (course.courseTypes && course.courseTypes.length > 0) {
        // Verificar si el usuario tiene acceso según su suscripción
        const hasPremiumType = course.courseTypes.some(
          (type) => type.requiredSubscriptionLevel === 'premium'
        );
        const hasProType = course.courseTypes.some(
          (type) => type.requiredSubscriptionLevel === 'pro'
        );
        const hasFreeType = course.courseTypes.some(
          (type) =>
            type.requiredSubscriptionLevel === 'none' &&
            !type.isPurchasableIndividually
        );
        const hasPurchasableType = course.courseTypes.some(
          (type) => type.isPurchasableIndividually
        );

        // Lógica de acceso según la suscripción
        if (userPlanType === 'Premium') {
          // Usuario Premium tiene acceso a todos los cursos con suscripción
          requiresPayment =
            !hasPremiumType &&
            !hasProType &&
            !hasFreeType &&
            hasPurchasableType;
        } else if (userPlanType === 'Pro') {
          // Usuario Pro necesita actualizar para cursos Premium
          isPremiumRequired = hasPremiumType && !hasProType && !hasFreeType;
          requiresPayment =
            !hasProType &&
            !hasFreeType &&
            hasPurchasableType &&
            !isPremiumRequired;
          requiresUpgrade = isPremiumRequired;
        } else {
          // Usuario sin suscripción necesita pagar por cursos no gratuitos
          isPremiumRequired = hasPremiumType && !hasFreeType;
          requiresUpgrade = hasPremiumType || hasProType;
          requiresPayment = hasPurchasableType && !hasFreeType;
        }

        // Si requiere pago individual
        if (requiresPayment) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          if (purchasableType) {
            const courseProduct = createProductFromCourse(course);
            setSelectedProduct(courseProduct);
            setShowPaymentModal(true);
            return;
          }
        }

        // Si requiere actualización a Premium
        if (requiresUpgrade) {
          toast.error('Este curso requiere una suscripción superior', {
            description: isPremiumRequired
              ? 'Este curso requiere una suscripción Premium. Actualiza tu plan para acceder.'
              : 'Este curso requiere una suscripción. Actualiza tu plan para acceder.',
          });
          window.open('/planes', '_blank', 'noopener,noreferrer');
          return;
        }
      } else if (course.courseTypeId === 4) {
        // Mantener la lógica existente para cursos individuales
        if (!course.individualPrice) {
          toast.error('Error en el precio del curso');
          return;
        }

        const courseProduct = createProductFromCourse(course);
        setSelectedProduct(courseProduct);
        setShowPaymentModal(true);
        return;
      }

      // Lógica para manejo de programas
      const programMateria = course.materias?.find(
        (materia) => materia.programaId !== null
      );

      if (programMateria?.programaId && isSubscriptionActive) {
        try {
          const isProgramEnrolled = await isUserEnrolledInProgram(
            programMateria.programaId,
            user?.id ?? ''
          );

          if (!isProgramEnrolled) {
            // Show toast first and mark as shown to prevent duplicates
            setProgramToastShown(true);
            toast.warning(
              `Este curso requiere inscripción al programa "${programMateria.programa?.title}"`,
              {
                description:
                  'Serás redirigido a la página del programa para inscribirte.',
                duration: 4000,
                id: 'program-enrollment', // Use the same ID to prevent duplicates
              }
            );

            // Wait a moment for the toast to be visible
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Then redirect
            router.push(`/estudiantes/programas/${programMateria.programaId}`);
            return;
          }
        } catch (error) {
          console.error('Error checking program enrollment:', error);
          toast.error('Error al verificar la inscripción al programa');
          return;
        }
      }

      // Verificar si necesita suscripción
      const hasFreeType =
        course.courseTypes?.some(
          (type) =>
            type.requiredSubscriptionLevel === 'none' &&
            !type.isPurchasableIndividually
        ) ?? false;

      if (
        !hasFreeType &&
        course.courseType?.requiredSubscriptionLevel !== 'none' &&
        !isSubscriptionActive
      ) {
        window.open('/planes', '_blank', 'noopener,noreferrer');
        return;
      }

      // Si llega hasta aquí, proceder con la inscripción
      await onEnrollAction();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error enrolling:', errorMessage);
      toast.error('Error al inscribirse al curso');
    } finally {
      setIsEnrollClicked(false);
    }
  };

  // Create product object for individual course
  const courseProduct = useMemo(() => {
    if (course.courseTypeId === 4 && course.individualPrice) {
      return createProductFromCourse(course);
    }
    return null;
  }, [course]);

  // Add this interface near the top of the file with other interfaces
  interface PendingPurchase {
    courseId: number;
    type: 'individual';
  }

  // Update the useEffect that checks for pending purchase
  useEffect(() => {
    // Check for pending purchase after login
    const pendingPurchaseStr = localStorage.getItem('pendingPurchase');
    if (pendingPurchaseStr && isSignedIn) {
      try {
        const pendingPurchase = JSON.parse(
          pendingPurchaseStr
        ) as PendingPurchase;
        if (
          pendingPurchase.courseId === course.id &&
          pendingPurchase.type === 'individual'
        ) {
          // Clear the pending purchase
          localStorage.removeItem('pendingPurchase');
          // Show payment modal
          if (courseProduct) {
            setSelectedProduct(courseProduct);
            setShowPaymentModal(true);
          }
        }
      } catch (error) {
        console.error('Error processing pending purchase:', error);
      }
    }
  }, [isSignedIn, course.id, courseProduct]);

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

  return (
    <Card className="overflow-hidden bg-gray-800 p-0 text-white">
      {' '}
      {/* Cambiado a fondo oscuro */}
      <CardHeader className="px-0">
        {/* Título encima de la portada SOLO en mobile, en desktop encima de la portada */}
        <div className="block w-full px-4 pt-2 pb-2 sm:hidden">
          <h1 className="line-clamp-2 text-base font-bold text-cyan-300">
            {course.title}
          </h1>
        </div>
        {/* Título encima de la portada SOLO en desktop */}
        <div className="hidden w-full px-4 pt-2 pb-2 sm:block">
          <h1 className="line-clamp-2 text-xl font-bold text-cyan-300 md:text-2xl lg:text-3xl">
            {course.title}
          </h1>
        </div>
        <div className="relative mb-4 w-full transition-all duration-200 sm:-mb-40 sm:h-auto">
          {/* Cambia el aspect ratio de 16/7 a 16/7 solo en pantallas sm+ y reduce en móviles */}
          <AspectRatio ratio={16 / 9} className="sm:aspect-[16/7]">
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
                {/* Nota: La calidad del video depende del archivo fuente subido a S3. 
                    Para máxima calidad, asegúrate de subir un video de alta resolución (idealmente 1920x720 o superior para 16:6). 
                    El navegador reproducirá el archivo tal cual, no hay atributo HTML para "calidad máxima" en <video> con archivos .mp4 directos. */}
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
          {/* Eliminar el título dentro de la portada SOLO en desktop */}
          {/* <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4 sm:block md:p-6">
            <h1 className="line-clamp-2 text-xl font-bold text-white md:text-2xl lg:text-3xl">
              {course.title}
            </h1>
          </div> */}
        </div>
        {/* NUEVO: Metadatos principales debajo de la portada en mobile */}
        <div className="relative z-10 -mt-1 -mb-4 block w-full px-4 sm:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary bg-background text-primary w-fit hover:bg-black/70"
            >
              {course.category?.name}
            </Badge>
            {getCourseTypeLabel()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="mx-auto w-full max-w-7xl space-y-4 px-4 sm:px-6">
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
              <div className="flex items-center">
                <FaCalendar className="mr-2 text-white" /> {/* icono blanco */}
                <span className="text-xs text-white sm:text-sm">
                  Creado: {formatDateString(course.createdAt)}
                </span>
              </div>
              <div className="flex items-center">
                <FaClock className="mr-2 text-white" /> {/* icono blanco */}
                <span className="text-xs text-white sm:text-sm">
                  Actualizado: {formatDateString(course.updatedAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="-mt-1 flex items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center">
              <FaUserGraduate className="mr-2 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600 sm:text-base">
                {Math.max(0, totalStudents)}{' '}
                {totalStudents === 1 ? 'Estudiante' : 'Estudiantes'}
              </span>
            </div>
            <div className="flex items-center">
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
        </div>

        {/* Course type and instructor info */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full space-y-4">
            <div className="-mt-2 flex w-full items-center justify-between sm:-mt-2 sm:-mb-2">
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

          {/* Price button with space theme */}
          {course.courseTypeId === 4 &&
            course.individualPrice &&
            !isEnrolled && (
              <div className="flex flex-col items-center gap-4">
                <button onClick={handleEnrollClick} className="btn">
                  <strong>
                    <span>${course.individualPrice.toLocaleString()}</span>
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
            {course.materias?.map((materia: CourseMateria, index: number) => (
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

        {/* Course lessons */}
        <CourseContent
          course={course}
          isEnrolled={isEnrolled}
          isSubscriptionActive={isSubscriptionActive}
          subscriptionEndDate={subscriptionEndDate}
          isSignedIn={!!isSignedIn} // Convert to boolean with !! operator
        />

        {/* Enrollment buttons with space theme */}
        <div className="flex justify-center pt-4">
          <div className="relative h-32">
            {isEnrolled ? (
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
                      {course.courseTypeId === 4 && (
                        <span>${course.individualPrice?.toLocaleString()}</span>
                      )}
                      <span>
                        {course.courseTypeId === 4
                          ? 'Comprar Curso'
                          : course.courseType?.requiredSubscriptionLevel ===
                              'none'
                            ? 'Inscribirse Gratis'
                            : !isSubscriptionActive
                              ? 'Obtener Suscripción'
                              : 'Inscribirse al Curso'}
                      </span>
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
      {showPaymentModal && courseProduct && selectedProduct && (
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
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-0 right-0 mt-2 mr-2 text-gray-300 hover:text-white"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>
            <PaymentForm selectedProduct={selectedProduct} />
          </div>
        </div>
      )}
    </Card>
  );
}
