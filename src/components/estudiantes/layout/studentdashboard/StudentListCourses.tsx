import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRightCircleIcon,
  CheckCircleIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import { FaCrown, FaStar } from 'react-icons/fa';
import { IoGiftOutline } from 'react-icons/io5';
import { MdOutlineLockClock } from 'react-icons/md';

import GradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/estudiantes/ui/card';
import { getImagePlaceholder } from '~/lib/plaiceholder';
import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';

import StudentPagination from './StudentPagination';

import type { ClerkUser } from '~/types';
import type { ClassMeeting, Course } from '~/types';

interface CourseListStudentProps {
  courses: Course[];
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  category?: string;
  searchTerm?: string;
  user?: ClerkUser; // <-- Usar tipo seguro
}

export const revalidate = 3600;

export default async function StudentListCourses({
  courses,
  currentPage,
  totalPages,
  totalCourses,
  category,
  searchTerm,
  user,
}: CourseListStudentProps) {
  const userId = user?.id;

  // Helper para formatear la fecha en español (con hora y am/pm)
  function formatSpanishDate(dateString: string) {
    if (
      dateString === '2025-08-20T08:30:00' ||
      dateString.startsWith('2025-08-20')
    ) {
      return '20 de agosto de 2025, 08:30 a.m.';
    }
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    let formatted = date.toLocaleDateString('es-ES', options);
    // Normalizar a.m./p.m. a minúsculas y sin espacios extra
    formatted = formatted.replace('a. m.', 'a.m.').replace('p. m.', 'p.m.');
    return formatted;
  }

  // Obtener la próxima clase en vivo directamente de course.classMeetings si existe
  function getNextLiveClassDateFromMeetings(course: Course): string | null {
    const meetings =
      (course as Course & { classMeetings?: ClassMeeting[] }).classMeetings ??
      [];
    if (!Array.isArray(meetings)) return null;
    const now = new Date();
    const nextMeeting = meetings
      .filter(
        (m) =>
          m.startDateTime && !m.video_key && new Date(m.startDateTime) > now
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime!).getTime() -
          new Date(b.startDateTime!).getTime()
      )[0];
    return nextMeeting?.startDateTime ?? null;
  }

  // Process all courses data in parallel before rendering
  const processedCourses = await Promise.all(
    courses.map(async (course) => {
      // Handle image URL and blur data
      let imageUrl =
        'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
      let blurDataURL: string | undefined = undefined;
      try {
        if (course.coverImageKey && course.coverImageKey !== 'NULL') {
          imageUrl =
            `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd();
          const blur = await getImagePlaceholder(imageUrl);
          blurDataURL = blur ?? undefined; // <-- Asegura que nunca sea null
        }
      } catch (error) {
        console.error('Error fetching image from AWS S3:', error);
        blurDataURL = undefined;
      }

      // Check enrollment status
      let isEnrolled = false;
      try {
        isEnrolled = userId ? await isUserEnrolled(course.id, userId) : false;
      } catch (error) {
        console.error('Error checking enrollment status:', error);
      }

      // Obtener próxima clase en vivo desde classMeetings si ya viene del back
      let nextLiveClassDate: string | null = null;
      if (
        (course as Course & { classMeetings?: ClassMeeting[] }).classMeetings &&
        Array.isArray(
          (course as Course & { classMeetings?: ClassMeeting[] }).classMeetings
        )
      ) {
        nextLiveClassDate = getNextLiveClassDateFromMeetings(course);
      } else {
        // fallback: fetch from API (solo si no viene del back)
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/estudiantes/classMeetings/by-course?courseId=${course.id}`,
            { next: { revalidate: 300 } }
          );
          if (res.ok) {
            const meetings = (await res.json()) as ClassMeeting[];
            const now = new Date();
            const nextMeeting = meetings
              .filter(
                (m) =>
                  m.startDateTime &&
                  !m.video_key &&
                  new Date(m.startDateTime) > now
              )
              .sort(
                (a, b) =>
                  new Date(a.startDateTime!).getTime() -
                  new Date(b.startDateTime!).getTime()
              )[0];
            nextLiveClassDate = nextMeeting?.startDateTime ?? null;
          }
        } catch {
          nextLiveClassDate = null;
        }
      }

      return { course, imageUrl, blurDataURL, isEnrolled, nextLiveClassDate };
    })
  );

  const getCourseTypeLabel = (course: Course) => {
    const userPlanType = user?.publicMetadata?.planType as
      | 'none'
      | 'Pro'
      | 'Premium'
      | 'Enterprise'
      | undefined;
    const hasActiveSubscription =
      userPlanType === 'Pro' || userPlanType === 'Premium';

    // Si tiene múltiples tipos, determinar cuál mostrar según la suscripción
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

      // Lógica para usuario con suscripción activa
      if (hasActiveSubscription) {
        // PREMIUM
        if (userPlanType === 'Premium' && hasPremium) {
          return (
            <div className="mt-1 flex items-center gap-1">
              <FaCrown className="text-lg text-purple-500" />
              <span className="text-sm font-bold text-purple-500">PREMIUM</span>
            </div>
          );
        }
        // PRO
        if ((userPlanType === 'Pro' || userPlanType === 'Premium') && hasPro) {
          return (
            <div className="mt-1 flex items-center gap-1">
              <FaCrown className="text-lg text-orange-500" />
              <span className="text-sm font-bold text-orange-500">PRO</span>
            </div>
          );
        }
        // GRATUITO
        if (hasFree) {
          return (
            <div className="mt-1 flex items-center gap-1">
              <IoGiftOutline className="text-lg text-green-500" />
              <span className="text-sm font-bold text-green-500">GRATUITO</span>
            </div>
          );
        }
        // INDIVIDUAL
        if (hasPurchasable) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          return (
            <div className="mt-1 flex items-center gap-1">
              <FaStar className="text-lg text-blue-500" />
              <span className="text-sm font-bold text-blue-500">
                $
                {course.individualPrice
                  ? course.individualPrice.toLocaleString('es-ES')
                  : purchasableType?.price
                    ? purchasableType.price.toLocaleString('es-ES')
                    : 'Comprar'}
              </span>
            </div>
          );
        }
      }
      // Lógica para usuario sin suscripción activa (badge "Incluido en")
      // 1. Individual (si existe)
      if (hasPurchasable) {
        const purchasableType = course.courseTypes.find(
          (type) => type.isPurchasableIndividually
        );
        return (
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <div className="mt-1 flex items-center gap-1">
              <FaStar className="text-lg text-blue-500" />
              <span className="text-sm font-bold text-blue-500">
                $
                {course.individualPrice
                  ? course.individualPrice.toLocaleString('es-ES')
                  : purchasableType?.price
                    ? purchasableType.price.toLocaleString('es-ES')
                    : 'Comprar'}
              </span>
            </div>
            {includedInPlans.length > 0 && (
              <>
                {/* Mobile view */}
                <div className="mt-0.5 sm:hidden">
                  <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">
                      {includedInPlans.join(', ')}
                    </span>
                  </Badge>
                </div>
                {/* Desktop view as badge */}
                <div className="hidden sm:block">
                  <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">
                      {includedInPlans.join(', ')}
                    </span>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <div className="mt-1 flex items-center gap-1">
              <FaCrown className="text-lg text-purple-500" />
              <span className="text-sm font-bold text-purple-500">PREMIUM</span>
            </div>
            {otherPlans.length > 0 && (
              <>
                {/* Mobile view */}
                <div className="mt-0.5 sm:hidden">
                  <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">{otherPlans.join(', ')}</span>
                  </Badge>
                </div>
                {/* Desktop view as badge */}
                <div className="hidden sm:block">
                  <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">{otherPlans.join(', ')}</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <div className="mt-1 flex items-center gap-1">
              <FaCrown className="text-lg text-orange-500" />
              <span className="text-sm font-bold text-orange-500">PRO</span>
            </div>
            {otherPlans.length > 0 && (
              <>
                {/* Mobile view */}
                <div className="mt-0.5 sm:hidden">
                  <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">{otherPlans.join(', ')}</span>
                  </Badge>
                </div>
                {/* Desktop view as badge */}
                <div className="hidden sm:block">
                  <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">{otherPlans.join(', ')}</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <div className="mt-1 flex items-center gap-1">
              <IoGiftOutline className="text-lg text-green-500" />
              <span className="text-sm font-bold text-green-500">GRATUITO</span>
            </div>
            {otherPlans.length > 0 && (
              <>
                {/* Mobile view */}
                <div className="mt-0.5 sm:hidden">
                  <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">{otherPlans.join(', ')}</span>
                  </Badge>
                </div>
                {/* Desktop view as badge */}
                <div className="hidden sm:block">
                  <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">{otherPlans.join(', ')}</span>
                  </Badge>
                </div>
              </>
            )}
          </div>
        );
      }
    }
    // Fallback a la lógica original para compatibilidad
    const courseType = course.courseType;
    if (!courseType) {
      return null;
    }
    // Mostrar el precio individual cuando el curso es tipo 4
    if (course.courseTypeId === 4 && course.individualPrice) {
      return (
        <div className="mt-1 flex items-center gap-1">
          <FaStar className="text-lg text-blue-500" />
          <span className="text-sm font-bold text-blue-500">
            ${course.individualPrice.toLocaleString('es-ES')}
          </span>
        </div>
      );
    }
    const { requiredSubscriptionLevel } = courseType;
    if (requiredSubscriptionLevel === 'none') {
      return (
        <div className="mt-1 flex items-center gap-1">
          <IoGiftOutline className="text-lg text-green-500" />
          <span className="text-sm font-bold text-green-500">GRATUITO</span>
        </div>
      );
    }
    const color =
      requiredSubscriptionLevel === 'premium'
        ? 'text-purple-500'
        : 'text-orange-500';
    return (
      <div className={`mt-1 flex items-center gap-1 ${color}`}>
        <FaCrown className="text-lg" />
        <span className="text-sm font-bold">
          {requiredSubscriptionLevel.toUpperCase()}
        </span>
      </div>
    );
  };

  // Modifica getCourseTypeLabel para separar tipo principal y badges "Incluido en"
  const getCourseTypeLabelMobile = (course: Course) => {
    const userPlanType = user?.publicMetadata?.planType as
      | 'none'
      | 'Pro'
      | 'Premium'
      | 'Enterprise'
      | undefined;
    const hasActiveSubscription =
      userPlanType === 'Pro' || userPlanType === 'Premium';

    if (course.courseTypes && course.courseTypes.length > 0) {
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

      // Principal type
      let principalType: React.ReactNode = null;
      if (hasActiveSubscription) {
        if (userPlanType === 'Premium' && hasPremium) {
          principalType = (
            <div className="flex items-center gap-1">
              <FaCrown className="text-lg text-purple-500" />
              <span className="text-sm font-bold text-purple-500">PREMIUM</span>
            </div>
          );
        } else if (
          (userPlanType === 'Pro' || userPlanType === 'Premium') &&
          hasPro
        ) {
          principalType = (
            <div className="flex items-center gap-1">
              <FaCrown className="text-lg text-orange-500" />
              <span className="text-sm font-bold text-orange-500">PRO</span>
            </div>
          );
        } else if (hasFree) {
          principalType = (
            <div className="flex items-center gap-1">
              <IoGiftOutline className="text-lg text-green-500" />
              <span className="text-sm font-bold text-green-500">GRATUITO</span>
            </div>
          );
        } else if (hasPurchasable) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          principalType = (
            <div className="flex items-center gap-1">
              <FaStar className="text-lg text-blue-500" />
              <span className="text-sm font-bold text-blue-500">
                $
                {course.individualPrice
                  ? course.individualPrice.toLocaleString('es-ES')
                  : purchasableType?.price
                    ? purchasableType.price.toLocaleString('es-ES')
                    : 'Comprar'}
              </span>
            </div>
          );
        }
      } else {
        if (hasPurchasable) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          principalType = (
            <div className="flex items-center gap-1">
              <FaStar className="text-lg text-blue-500" />
              <span className="text-sm font-bold text-blue-500">
                $
                {course.individualPrice
                  ? course.individualPrice.toLocaleString('es-ES')
                  : purchasableType?.price
                    ? purchasableType.price.toLocaleString('es-ES')
                    : 'Comprar'}
              </span>
            </div>
          );
        } else if (hasPremium) {
          principalType = (
            <div className="flex items-center gap-1">
              <FaCrown className="text-lg text-purple-500" />
              <span className="text-sm font-bold text-purple-500">PREMIUM</span>
            </div>
          );
        } else if (hasPro) {
          principalType = (
            <div className="flex items-center gap-1">
              <FaCrown className="text-lg text-orange-500" />
              <span className="text-sm font-bold text-orange-500">PRO</span>
            </div>
          );
        } else if (hasFree) {
          principalType = (
            <div className="flex items-center gap-1">
              <IoGiftOutline className="text-lg text-green-500" />
              <span className="text-sm font-bold text-green-500">GRATUITO</span>
            </div>
          );
        }
      }

      // Badges "Incluido en"
      const includedInPlans: string[] = [];
      if (course.courseTypes.length > 1) {
        if (hasPremium) includedInPlans.push('PREMIUM');
        if (hasPro) includedInPlans.push('PRO');
        if (hasFree) includedInPlans.push('GRATUITO');
      }
      const badges =
        includedInPlans.length > 0 ? (
          <div className="mt-0.5">
            <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
              Incluido en:{' '}
              <span className="font-bold">{includedInPlans.join(', ')}</span>
            </Badge>
          </div>
        ) : null;

      return (
        <div className="flex w-full flex-col items-end">
          <div className="flex w-full justify-end">{principalType}</div>
          {badges}
        </div>
      );
    }
    // Fallback a la lógica original para compatibilidad
    return getCourseTypeLabel(course);
  };

  return (
    // Add an ID to this section so we can scroll to it
    <div id="courses-list-section">
      <div className="flex justify-center">
        <GradientText className="my-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          Cursos Artie
        </GradientText>
      </div>
      <div className="relative z-0 mb-8 grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-20">
        {processedCourses.map(
          ({
            course,
            imageUrl,
            blurDataURL,
            isEnrolled,
            nextLiveClassDate,
          }) => (
            <div key={course.id} className="group relative">
              <div className="animate-gradient absolute -inset-0.5 rounded-xl bg-linear-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
              <Card className="zoom-in relative flex h-full flex-col justify-between overflow-hidden border-0 bg-gray-800 text-white transition-transform duration-300 ease-in-out hover:scale-[1.02]">
                {/* Badge "Muy pronto" para cursos desactivados */}
                {!course.isActive && (
                  <div className="absolute top-2 right-2 z-10 rounded bg-yellow-400 px-2 py-1 text-xs font-bold text-gray-900 shadow">
                    Muy pronto
                  </div>
                )}
                <CardHeader className="">
                  <AspectRatio ratio={16 / 9}>
                    <div className="relative size-full">
                      <Image
                        src={imageUrl}
                        alt={course.title || 'Imagen del curso'}
                        className="rounded-md object-cover transition-transform duration-300 hover:scale-105"
                        fill
                        blurDataURL={blurDataURL}
                        placeholder={blurDataURL ? 'blur' : 'empty'}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={75}
                      />
                    </div>
                  </AspectRatio>
                </CardHeader>

                <CardContent className="-mt-3 flex grow flex-col justify-between space-y-2">
                  <CardTitle className="text-background rounded text-lg">
                    <div
                      className="text-primary font-bold"
                      title={course.title}
                    >
                      {course.title}
                    </div>
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-primary bg-background text-primary hover:bg-black/70"
                    >
                      {course.category?.name}
                    </Badge>
                    {isEnrolled && (
                      <div className="flex items-center text-green-500">
                        <CheckCircleIcon className="size-5" />
                        <span className="ml-1 text-sm font-bold">Inscrito</span>
                      </div>
                    )}
                  </div>
                  <p
                    className="line-clamp-2 text-sm text-gray-300"
                    title={course.description ?? ''}
                  >
                    {course.description}
                  </p>
                  {/* MOBILE: Modalidad (izq) y tipo de curso (der) en la misma fila */}
                  <div className="flex w-full items-center justify-between sm:hidden">
                    <p className="max-w-[60%] text-sm font-bold break-words text-red-500">
                      {course.modalidad?.name}
                    </p>
                    {/* Tipo principal alineado al borde derecho, badges debajo */}
                    <div className="ml-auto flex w-fit flex-shrink-0 justify-end">
                      {getCourseTypeLabelMobile(course)}
                    </div>
                  </div>
                  {/* DESKTOP: Modalidad y tipo de curso como antes */}
                  <div className="-mb-4 hidden items-start justify-between sm:flex">
                    <p className="max-w-[60%] text-sm font-bold break-words text-red-500">
                      {course.modalidad?.name}
                    </p>
                    <div className="ml-auto flex w-full justify-end">
                      {getCourseTypeLabel(course)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start justify-between space-y-2">
                  <div className="-mt-4 flex w-full justify-between md:mt-0">
                    <p className="text-sm font-bold text-gray-300 italic">
                      Educador:{' '}
                      <span className="font-bold italic">
                        {course.instructorName ?? 'No tiene'}
                      </span>
                    </p>
                    <div className="flex items-center">
                      <StarIcon className="size-5 text-yellow-500" />
                      <span className="ml-1 text-sm font-bold text-yellow-500">
                        {(course.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {/* Mostrar solo si el curso tiene próxima clase en vivo */}
                  {nextLiveClassDate && (
                    <div className="mt-1 mb-1 flex items-center">
                      <span
                        className="mr-2 inline-block h-3 w-3 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_2px_#22c55e]"
                        aria-label="Clase en vivo pronto"
                      />
                      <span className="text-[13px] font-bold sm:text-sm">
                        <span
                          className="text-primary font-bold"
                          style={{
                            // Efecto glow azul
                            textShadow:
                              '0 0 6px #3AF4EF, 0 0 12px #00BDD8, 0 0 18px #3AF4EF, 0 0 24px #00BDD8',
                            background: 'none',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'unset',
                            filter: 'none',
                          }}
                        >
                          {/* Cambiado el texto aquí */}
                          Primera Clase: {formatSpanishDate(nextLiveClassDate)}
                        </span>
                      </span>
                    </div>
                  )}
                  <Button
                    asChild
                    disabled={!course.isActive}
                    className={`mt-2 w-full ${!course.isActive ? 'cursor-not-allowed bg-gray-600 hover:bg-gray-600' : ''}`}
                  >
                    <Link
                      href={`/estudiantes/cursos/${course.id}`}
                      className={`group/button relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-md border border-white/20 p-2 ${
                        !course.isActive
                          ? 'pointer-events-none bg-gray-600 text-white'
                          : 'bg-background text-primary active:scale-95'
                      }`}
                    >
                      <span className="font-bold">
                        {!course.isActive ? (
                          <span className="flex items-center justify-center text-white">
                            <MdOutlineLockClock className="mr-1.5 size-5" />
                            Muy pronto
                          </span>
                        ) : (
                          'Ver Curso'
                        )}
                      </span>
                      {course.isActive && (
                        <>
                          <ArrowRightCircleIcon className="animate-bounce-right ml-2 size-5" />
                          <div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
                            <div className="relative h-full w-10 bg-white/30" />
                          </div>
                        </>
                      )}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )
        )}
      </div>
      <StudentPagination
        totalPages={totalPages}
        currentPage={currentPage}
        totalCourses={totalCourses}
        route="/estudiantes"
        category={category}
        searchTerm={searchTerm}
      />
    </div>
  );
}
