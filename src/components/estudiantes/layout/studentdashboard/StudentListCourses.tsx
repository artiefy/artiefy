import Image from 'next/image';
import Link from 'next/link';

import { currentUser } from '@clerk/nextjs/server';
import { BookOpenIcon } from '@heroicons/react/24/outline';
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

import type { Course } from '~/types';

interface CourseListStudentProps {
  courses: Course[];
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  category?: string;
  searchTerm?: string;
}

export const revalidate = 3600;

export default async function StudentListCourses({
  courses,
  currentPage,
  totalPages,
  totalCourses,
  category,
  searchTerm,
}: CourseListStudentProps) {
  const user = await currentUser();
  const userId = user?.id;

  if (!courses || courses.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
        <BookOpenIcon className="text-primary h-16 w-16 animate-pulse" />
        <div className="space-y-2">
          <h3 className="text-primary text-2xl font-bold">
            No hay cursos disponibles
          </h3>
          <p className="text-gray-500">
            No se encontraron cursos que coincidan con tu búsqueda.
            {searchTerm ? ' Intenta con otros términos de búsqueda.' : ''}
            {category ? ' Prueba con otra categoría.' : ''}
          </p>
        </div>
      </div>
    );
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

      return { course, imageUrl, blurDataURL, isEnrolled };
    })
  );

  const getCourseTypeLabel = (course: Course) => {
    const userPlanType = user?.publicMetadata?.planType as string;
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
    const userPlanType = user?.publicMetadata?.planType as string;
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
    <>
      <div className="flex justify-center">
        <GradientText className="my-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          Cursos Artie
        </GradientText>
      </div>
      <div className="relative z-0 mb-8 grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-20">
        {processedCourses.map(
          ({ course, imageUrl, blurDataURL, isEnrolled }) => (
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
                    <div className="text-primary font-bold">{course.title}</div>
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
                  <p className="line-clamp-2 text-sm text-gray-300">
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
                  <Button
                    asChild
                    disabled={!course.isActive}
                    className={`mt-2 w-full ${!course.isActive ? 'cursor-not-allowed bg-gray-600 hover:bg-gray-600' : ''}`}
                  >
                    <Link
                      href={`/estudiantes/cursos/${course.id}`}
                      className={`group/button relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-md border border-white/20 p-2 ${
                        !course.isActive
                          ? 'pointer-events-none bg-gray-600 text-white' /* Changed from text-gray-400 to text-white */
                          : 'bg-background text-primary active:scale-95'
                      }`}
                    >
                      <span className="font-bold">
                        {!course.isActive ? (
                          <span className="flex items-center justify-center text-white">
                            {' '}
                            {/* Added text-white here */}
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
    </>
  );
}
