'use client';

import { useEffect, useMemo, useState } from 'react';

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
  FaStar,
  FaTimes,
  FaTrophy,
  FaUserGraduate,
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
import { formatDate, type GradesApiResponse } from '~/lib/utils2';
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

const isVideoMedia = (coverImageKey: string | null | undefined): boolean => {
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

          if (!isProgramEnrolled) {
            toast.warning('Este curso requiere inscripción al programa', {});
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
  }, [course.materias, user?.id, isEnrolled, router]);

  // Helper function to format dates
  const formatDateString = (date: string | number | Date): string => {
    return formatDate(new Date(date));
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
    const courseType = course.courseType;
    if (!courseType) {
      return null;
    }

    const { requiredSubscriptionLevel } = courseType;

    // Mostrar el precio individual cuando el curso es tipo 4
    if (course.courseTypeId === 4 && course.individualPrice) {
      return (
        <div className="flex items-center gap-1">
          <FaStar className="text-lg text-blue-500" />
          <span className="text-base font-bold text-blue-500">
            ${course.individualPrice.toLocaleString()}
          </span>
        </div>
      );
    }

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

    setIsEnrollClicked(true); // Activar spinner inmediatamente

    try {
      // Handle individual course purchase
      if (course.courseTypeId === 4) {
        if (!course.individualPrice) {
          toast.error('Error en el precio del curso');
          return;
        }

        const courseProduct = createProductFromCourse(course);
        setSelectedProduct(courseProduct);
        setShowPaymentModal(true);
        return;
      }

      const userPlanType = user?.publicMetadata?.planType as string;
      const isPremiumCourse =
        course.courseType?.requiredSubscriptionLevel === 'premium';
      const programMateria = course.materias?.find(
        (materia) => materia.programaId !== null
      );

      // First check: If Pro user trying to access Premium course
      if (userPlanType === 'Pro' && isPremiumCourse) {
        toast.error('Acceso Restringido', {
          description:
            'Este curso requiere una suscripción Premium. Actualiza tu plan para acceder.',
        });
        window.open('/planes', '_blank', 'noopener,noreferrer');
        return;
      }

      // Second check: If Premium user but needs program enrollment
      if (programMateria?.programaId && isSubscriptionActive) {
        try {
          const isProgramEnrolled = await isUserEnrolledInProgram(
            programMateria.programaId,
            user?.id ?? ''
          );

          if (!isProgramEnrolled) {
            // Show toast first
            toast.warning(
              `Este curso requiere inscripción al programa "${programMateria.programa?.title}"`,
              {
                description:
                  'Serás redirigido a la página del programa para inscribirte.',
                duration: 4000,
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

      // Regular subscription check
      if (
        course.courseType?.requiredSubscriptionLevel !== 'none' &&
        !isSubscriptionActive
      ) {
        window.open('/planes', '_blank', 'noopener,noreferrer');
        return;
      }

      await onEnrollAction();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error enrolling:', errorMessage);
      toast.error('Error al inscribirse al curso');
    } finally {
      setIsEnrollClicked(false); // Desactivar spinner al finalizar
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

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="px-0">
        <AspectRatio ratio={16 / 6}>
          {/* Nueva lógica de portada/video */}
          {coverVideoCourseKey ? (
            <video
              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverVideoCourseKey}`}
              className="h-full w-full object-cover"
              controls
              autoPlay
              muted
              loop
              playsInline
              poster={
                coverImageKey
                  ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`.trimEnd()
                  : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
              }
            />
          ) : coverImageKey ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`.trimEnd()}
              alt={course.title}
              fill
              className="object-cover"
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
              className="object-cover"
              priority
              sizes="100vw"
              placeholder="blur"
              blurDataURL={blurDataURL}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/50 to-transparent p-4 md:p-6">
            <h1 className="line-clamp-2 text-xl font-bold text-white md:text-2xl lg:text-3xl">
              {course.title}
            </h1>
          </div>
        </AspectRatio>
      </CardHeader>

      <CardContent className="mx-auto w-full max-w-7xl space-y-4 px-4 sm:px-6">
        {/* Course metadata */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-primary bg-background text-primary w-fit hover:bg-black/70"
                >
                  {course.category?.name}
                </Badge>
                {/* Moved course type label here */}
                {getCourseTypeLabel()}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center">
                  <FaCalendar className="mr-2 text-gray-600" />
                  <span className="text-xs text-gray-600 sm:text-sm">
                    Creado: {formatDateString(course.createdAt)}
                  </span>
                </div>
                <div className="flex items-center">
                  <FaClock className="mr-2 text-gray-600" />
                  <span className="text-xs text-gray-600 sm:text-sm">
                    Actualizado: {formatDateString(course.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 sm:gap-6">
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
          <div className="space-y-4">
            <div>
              <h3 className="text-background text-base font-extrabold sm:text-lg">
                {course.instructorName ?? 'Instructor no encontrado'}
              </h3>
              <em className="text-sm font-bold text-gray-600 sm:text-base">
                Educador
              </em>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
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
                : 'bg-gray-400/50 text-gray-700'
            )}
            aria-label={
              !isEnrolled
                ? 'Debes inscribirte al curso'
                : 'Completa todas las clases para ver tus calificaciones'
            }
          >
            <FaTrophy className="mr-2 h-4 w-4" />
            <span className="text-sm font-semibold">Mis Calificaciones</span>
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
            <p className="text-justify text-sm leading-relaxed whitespace-pre-wrap text-gray-700 sm:text-base">
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
          <h3 className="text-sm font-semibold text-gray-600">
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
          <div className="w-full max-w-lg rounded-lg bg-white p-4">
            <div className="relative mb-4 flex items-center justify-between">
              <h3 className="w-full text-center text-xl font-semibold text-gray-900">
                Datos de Facturacion
                <br />
                <span className="font-bold">{course.title}</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-0 right-0 mt-2 mr-2 text-gray-500 hover:text-gray-700"
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
