import Image from 'next/image';
import Link from 'next/link';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { AiOutlineFire } from 'react-icons/ai';
import { FaCrown, FaStar } from 'react-icons/fa';
import { HiLibrary } from 'react-icons/hi';
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
            <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              <FaCrown className="h-3 w-3" />
              Premium
            </div>
          );
        }
        // PRO
        if ((userPlanType === 'Pro' || userPlanType === 'Premium') && hasPro) {
          return (
            <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              <FaStar className="h-3 w-3" />
              Pro
            </div>
          );
        }
        // GRATUITO
        if (hasFree) {
          return (
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <IoGiftOutline className="h-3 w-3" />
              Gratuito
            </div>
          );
        }
        // INDIVIDUAL
        if (hasPurchasable) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          return (
            <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400">
              <FaStar className="h-3 w-3" />${' '}
              {course.individualPrice
                ? course.individualPrice.toLocaleString('es-CO')
                : purchasableType?.price
                  ? purchasableType.price.toLocaleString('es-CO')
                  : 'Comprar'}
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
            <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400">
              <FaStar className="h-3 w-3" />${' '}
              {course.individualPrice
                ? course.individualPrice.toLocaleString('es-CO')
                : purchasableType?.price
                  ? purchasableType.price.toLocaleString('es-CO')
                  : 'Comprar'}
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
        if (includedInPlans.length > 1) {
          const formattedPlans = includedInPlans
            .map((plan) => plan.charAt(0) + plan.slice(1).toLowerCase())
            .join(' + ');
          return (
            <div className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
              <AiOutlineFire className="h-3 w-3" />
              {formattedPlans}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
            <FaCrown className="h-3 w-3" />
            Premium
          </div>
        );
      }
      // 3. Pro (si existe)
      if (hasPro) {
        if (includedInPlans.length > 1) {
          const formattedPlans = includedInPlans
            .map((plan) => plan.charAt(0) + plan.slice(1).toLowerCase())
            .join(' + ');
          return (
            <div className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
              <AiOutlineFire className="h-3 w-3" />
              {formattedPlans}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
            <FaStar className="h-3 w-3" />
            Pro
          </div>
        );
      }
      // 4. Free (si existe)
      if (hasFree) {
        if (includedInPlans.length > 1) {
          const formattedPlans = includedInPlans
            .map((plan) => plan.charAt(0) + plan.slice(1).toLowerCase())
            .join(' + ');
          return (
            <div className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
              <AiOutlineFire className="h-3 w-3" />
              {formattedPlans}
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <IoGiftOutline className="h-3 w-3" />
            Gratuito
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
        <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400">
          <FaStar className="h-3 w-3" />${' '}
          {course.individualPrice.toLocaleString('es-CO')}
        </div>
      );
    }
    const { requiredSubscriptionLevel } = courseType;
    if (requiredSubscriptionLevel === 'none') {
      return (
        <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          <IoGiftOutline className="h-3 w-3" />
          Gratuito
        </div>
      );
    }
    if (requiredSubscriptionLevel === 'premium') {
      return (
        <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
          <FaCrown className="h-3 w-3" />
          Premium
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
        <FaStar className="h-3 w-3" />
        Pro
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

      // Crear un array con los tipos adicionales
      const includedInPlans: string[] = [];
      if (course.courseTypes.length > 1) {
        if (hasPremium) includedInPlans.push('PREMIUM');
        if (hasPro) includedInPlans.push('PRO');
        if (hasFree) includedInPlans.push('GRATUITO');
      }

      // Principal type
      let principalType: React.ReactNode = null;
      if (hasActiveSubscription) {
        if (userPlanType === 'Premium' && hasPremium) {
          principalType = (
            <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              <FaCrown className="h-3 w-3" />
              Premium
            </div>
          );
        } else if (
          (userPlanType === 'Pro' || userPlanType === 'Premium') &&
          hasPro
        ) {
          principalType = (
            <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              <FaCrown className="h-3 w-3" />
              Pro
            </div>
          );
        } else if (hasFree) {
          principalType = (
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <IoGiftOutline className="h-3 w-3" />
              Gratuito
            </div>
          );
        } else if (hasPurchasable) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          principalType = (
            <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400">
              <FaStar className="h-3 w-3" />${' '}
              {course.individualPrice
                ? course.individualPrice.toLocaleString('es-CO')
                : purchasableType?.price
                  ? purchasableType.price.toLocaleString('es-CO')
                  : 'Comprar'}
            </div>
          );
        }
      } else {
        if (hasPurchasable) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          principalType = (
            <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400">
              <FaStar className="h-3 w-3" />${' '}
              {course.individualPrice
                ? course.individualPrice.toLocaleString('es-CO')
                : purchasableType?.price
                  ? purchasableType.price.toLocaleString('es-CO')
                  : 'Comprar'}
            </div>
          );
        } else if (hasPremium) {
          if (includedInPlans.length > 1) {
            const formattedPlans = includedInPlans
              .map((plan) => plan.charAt(0) + plan.slice(1).toLowerCase())
              .join(' + ');
            principalType = (
              <div className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                <AiOutlineFire className="h-3 w-3" />
                {formattedPlans}
              </div>
            );
          } else {
            principalType = (
              <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                <FaCrown className="h-3 w-3" />
                Premium
              </div>
            );
          }
        } else if (hasPro) {
          if (includedInPlans.length > 1) {
            const formattedPlans = includedInPlans
              .map((plan) => plan.charAt(0) + plan.slice(1).toLowerCase())
              .join(' + ');
            principalType = (
              <div className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                <AiOutlineFire className="h-3 w-3" />
                {formattedPlans}
              </div>
            );
          } else {
            principalType = (
              <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                <FaCrown className="h-3 w-3" />
                Pro
              </div>
            );
          }
        } else if (hasFree) {
          if (includedInPlans.length > 1) {
            const formattedPlans = includedInPlans
              .map((plan) => plan.charAt(0) + plan.slice(1).toLowerCase())
              .join(' + ');
            principalType = (
              <div className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                <AiOutlineFire className="h-3 w-3" />
                {formattedPlans}
              </div>
            );
          } else {
            principalType = (
              <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <IoGiftOutline className="h-3 w-3" />
                Gratuito
              </div>
            );
          }
        }
      }

      return principalType;
    }
    // Fallback a la lógica original para compatibilidad
    return getCourseTypeLabel(course);
  };

  return (
    // Add an ID to this section so we can scroll to it
    <div id="courses-list-section">
      <div className="mt-8 mb-3 flex justify-start px-8 sm:mb-3 lg:px-26">
        <div className="flex items-center gap-2">
          <HiLibrary className="text-xl text-white" />
          <GradientText className="text-2xl sm:text-3xl">
            Cursos Artie
          </GradientText>
        </div>
      </div>
      <div className="relative z-0 mb-8 grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-26">
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
                className={`artiefy-course-card zoom-in relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border-0 bg-[#061C37] p-4 text-foreground shadow-md transition-all duration-300 ${
                  course.isActive
                    ? 'cursor-pointer hover:-translate-y-1 hover:border-primary hover:shadow-xl'
                    : 'cursor-not-allowed'
                }`}
              >
                <div className="relative -mx-4 -mt-4 overflow-hidden">
                  <AspectRatio ratio={16 / 9}>
                    <div className="relative h-full w-full">
                      <Image
                        src={imageUrl}
                        alt={course.title || 'Imagen del curso'}
                        className="object-cover"
                        fill
                        blurDataURL={blurDataURL}
                        placeholder={blurDataURL ? 'blur' : 'empty'}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={75}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061C37] via-[#061C37]/60 to-transparent" />
                    </div>
                  </AspectRatio>
                </div>

                <div className="flex h-full flex-1 flex-col gap-3">
                  <h3 className="line-clamp-2 text-base leading-snug font-semibold text-white md:text-lg">
                    {course.title}
                  </h3>

                  <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-row">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-[#94A3B8]">
                        Por:{' '}
                        <span className="font-medium text-primary">
                          {course.instructorName ?? 'Educador'}
                        </span>
                      </p>
                      {isEnrolled && (
                        <div className="flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/20 px-2 py-0.5 text-green-400">
                          <CheckCircleIcon className="h-3 w-3" />
                          <span className="text-[10px] font-medium">
                            Inscrito
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center text-sm">
                      <div className="hidden sm:block">
                        {getCourseTypeLabel(course)}
                      </div>
                      <div className="block sm:hidden">
                        {getCourseTypeLabelMobile(course)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="chip chip-modalidad">
                      {course.modalidad?.name ?? 'Asistida Virtual'}
                    </span>
                    {course.horario && (
                      <span className="chip chip-horario">
                        {course.horario}
                      </span>
                    )}
                    {course.espacios && (
                      <span className="chip chip-espacios">
                        {course.espacios}
                      </span>
                    )}
                    <span className="chip chip-categoria">
                      {course.category?.name ?? 'Sin categoría'}
                    </span>
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    Empieza:{' '}
                    {nextLiveClassDate ? (
                      <span className="animate-pulse font-medium text-primary drop-shadow-[0_0_8px_rgba(58,244,239,0.6)]">
                        {formatSpanishDate(nextLiveClassDate)}
                      </span>
                    ) : course.modalidad &&
                      String(course.modalidad?.name)
                        .toLowerCase()
                        .includes('presencial') ? (
                      <span className="text-gray-100">Clases Presenciales</span>
                    ) : (
                      <span className="text-gray-100">Clases Virtuales</span>
                    )}
                  </p>
                </div>
              </Card>
            );

            const cardWrapperClass =
              'block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2';

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
                  <div className="group relative h-full rounded-2xl opacity-80">
                    {cardContent}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 text-lg font-semibold">
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
