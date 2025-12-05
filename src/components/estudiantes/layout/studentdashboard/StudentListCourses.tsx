import Image from 'next/image';
import Link from 'next/link';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { FaCrown, FaStar } from 'react-icons/fa';
import { IoGiftOutline } from 'react-icons/io5';

import GradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Card } from '~/components/estudiantes/ui/card';
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
                  <Badge className="rounded-full bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">
                      {includedInPlans.join(', ')}
                    </span>
                  </Badge>
                </div>
                {/* Desktop view as badge */}
                <div className="hidden sm:block">
                  <Badge className="rounded-full bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
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
                  <Badge className="rounded-full bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">{otherPlans.join(', ')}</span>
                  </Badge>
                </div>
                {/* Desktop view as badge */}
                <div className="hidden sm:block">
                  <Badge className="rounded-full bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
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
                  <Badge className="rounded-full bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
                    Incluido en:{' '}
                    <span className="font-bold">{otherPlans.join(', ')}</span>
                  </Badge>
                </div>
                {/* Desktop view as badge */}
                <div className="hidden sm:block">
                  <Badge className="rounded-full bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
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
          <Badge className="bg-yellow-400 text-[10px] text-gray-900 hover:bg-yellow-500">
            Incluido en:{' '}
            <span className="font-bold">{includedInPlans.join(', ')}</span>
          </Badge>
        ) : null;

      // En móvil mostrar el tipo principal y el texto "Incluido en" en una sola línea,
      // justificados a la izquierda. En dispositivos sm+ el layout original se mantiene.
      return (
        <div className="w-full">
          <div className="flex w-full items-center justify-start gap-2">
            <div className="flex items-center">{principalType}</div>
            {badges && <div className="flex items-center">{badges}</div>}
          </div>
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
          }) => {
            const cardContent = (
              <Card
                className={`artiefy-course-card zoom-in relative flex h-full flex-col gap-4 overflow-hidden border bg-[#1e2939] p-4 text-white transition-all duration-200 ease-in-out ${
                  course.isActive
                    ? 'hover:border-primary cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(58,244,239,0.5)]'
                    : 'cursor-not-allowed'
                }`}
              >
                <div className="-mx-4 -mt-4 overflow-hidden rounded-t-4xl bg-[#0b2238]">
                  <AspectRatio ratio={16 / 9}>
                    <div className="relative h-full w-full">
                      <Image
                        src={imageUrl}
                        alt={course.title || 'Imagen del curso'}
                        className="rounded-t-4xl object-cover"
                        fill
                        blurDataURL={blurDataURL}
                        placeholder={blurDataURL ? 'blur' : 'empty'}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={75}
                      />
                    </div>
                  </AspectRatio>
                </div>

                <div className="flex h-full flex-1 flex-col gap-3">
                  <div className="text-primary text-base font-bold">
                    {course.title}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        <span className="mr-1 text-sm text-gray-200">
                          Por :
                        </span>
                        <span className="font-semibold text-gray-200 italic">
                          {course.instructorName ?? 'Educador'}
                        </span>
                      </span>
                      {isEnrolled && (
                        <div className="ml-1 flex items-center text-green-400">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="ml-1 text-xs font-semibold">
                            Inscrito
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 ml-0 flex items-center text-sm sm:mt-0 sm:ml-2">
                      <div className="hidden sm:block">
                        {getCourseTypeLabel(course)}
                      </div>
                      <div className="block w-full sm:hidden">
                        {getCourseTypeLabelMobile(course)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-1">
                    <div className="flex flex-wrap items-center gap-1 lg:flex-nowrap lg:gap-1">
                      <Badge
                        variant="outline"
                        className="border-primary rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white sm:text-sm lg:px-1 lg:py-0.5 lg:text-xs"
                      >
                        {course.modalidad?.name ?? 'Asistida Virtual'}
                      </Badge>

                      {course.horario ? (
                        <Badge
                          variant="outline"
                          className="border-primary rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white sm:text-sm lg:px-1 lg:py-0.5 lg:text-xs"
                        >
                          {course.horario}
                        </Badge>
                      ) : null}

                      {course.espacios ? (
                        <Badge
                          variant="outline"
                          className="border-primary rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white sm:text-sm lg:px-1 lg:py-0.5 lg:text-xs"
                        >
                          {course.espacios}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-primary bg-secondary rounded-full px-2 py-0.5 text-xs text-black"
                      >
                        {course.category?.name ?? 'Sin categoría'}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm">
                    <div className="text-gray-400">
                      <span className="mr-1 text-gray-200">Empieza :</span>
                      {nextLiveClassDate ? (
                        <span
                          className="text-primary font-bold"
                          style={{
                            textShadow:
                              '0 0 6px #3AF4EF, 0 0 12px #00BDD8, 0 0 18px #3AF4EF, 0 0 24px #00BDD8',
                          }}
                        >
                          {formatSpanishDate(nextLiveClassDate)}
                        </span>
                      ) : (
                        <span className="text-primary font-bold">
                          Clases Virtuales
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );

            const cardWrapperClass =
              'block h-full rounded-4xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#010b16]';

            return (
              <div key={course.id} className="relative">
                {course.isActive ? (
                  <Link
                    href={`/estudiantes/cursos/${course.id}`}
                    aria-label={`Ver detalles del curso ${course.title}`}
                    className={`group ${cardWrapperClass}`}
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div className="group relative h-full rounded-4xl opacity-80">
                    {cardContent}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-4xl bg-black/40 text-lg font-semibold text-white">
                      Muy pronto
                    </div>
                  </div>
                )}
              </div>
            );
          }
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
