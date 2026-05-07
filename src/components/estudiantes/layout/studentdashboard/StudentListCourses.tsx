'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CalendarDays } from 'lucide-react';
import { AiOutlineFire } from 'react-icons/ai';
import { FaCrown, FaStar } from 'react-icons/fa';
import { HiLibrary } from 'react-icons/hi';
import { IoGiftOutline } from 'react-icons/io5';

import CourseSortControl from '~/components/estudiantes/layout/studentdashboard/CourseSortControl';
import GradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { getCourseCommentCounts } from '~/server/actions/estudiantes/comment/courseCommentActions';

import StudentPagination from './StudentPagination';

import type { CourseSortValue } from '~/components/estudiantes/layout/studentdashboard/CourseSortControl';
import type { ClerkUser } from '~/types';
import type { ClassMeeting, Course } from '~/types';

interface CourseListStudentProps {
  courses: Course[];
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  sectionId?: string;
  syncWithUrl?: boolean;
  category?: string;
  searchTerm?: string;
  sort?: CourseSortValue;
  user?: ClerkUser; // <-- Usar tipo seguro
}

const ITEMS_PER_PAGE = 12;
const COURSE_SORT_VALUES = ['random', 'az', 'created', 'category'] as const;

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isCourseSortValue(value: string | null): value is CourseSortValue {
  return COURSE_SORT_VALUES.includes(value as CourseSortValue);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

function sortCourses(courses: Course[], sort: CourseSortValue): Course[] {
  if (sort === 'az') {
    return [...courses].sort((a, b) =>
      a.title.localeCompare(b.title, 'es', { sensitivity: 'base' })
    );
  }

  if (sort === 'created') {
    return [...courses].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  if (sort === 'category') {
    return [...courses].sort((a, b) => {
      const typeCompare = (
        a.typeCourse?.type ??
        a.category?.name ??
        ''
      ).localeCompare(b.typeCourse?.type ?? b.category?.name ?? '', 'es', {
        sensitivity: 'base',
      });

      if (typeCompare !== 0) return typeCompare;

      return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    });
  }

  return shuffleArray(courses);
}

export default function StudentListCourses({
  courses,
  currentPage,
  sectionId = 'courses-list-section',
  syncWithUrl = true,
  category,
  searchTerm,
  sort = 'random',
  user,
}: CourseListStudentProps) {
  const searchParams = useSearchParams();
  const [sortValue, setSortValue] = useState<CourseSortValue>(sort);
  const [pageValue, setPageValue] = useState(currentPage);
  const [categoryValue, setCategoryValue] = useState<string | null>(
    category ?? null
  );
  const [searchTermValue, setSearchTermValue] = useState(searchTerm ?? '');
  const [commentCountsByCourseId, setCommentCountsByCourseId] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    if (!syncWithUrl) return;

    const nextSort = searchParams?.get('sort');
    const nextPage = Number(searchParams?.get('page') ?? currentPage);

    setSortValue(isCourseSortValue(nextSort) ? nextSort : sort);
    setPageValue(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
    setCategoryValue(searchParams?.get('category') ?? category ?? null);
    setSearchTermValue(searchParams?.get('query') ?? searchTerm ?? '');
  }, [category, currentPage, searchParams, searchTerm, sort, syncWithUrl]);

  function formatShortSpanishDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
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

  const filteredCourses = useMemo(() => {
    let nextCourses = courses;

    if (categoryValue) {
      const categoryId = Number(categoryValue);
      nextCourses = nextCourses.filter(
        (course) => course.categoryid === categoryId
      );
    }

    const trimmedSearchTerm = searchTermValue.trim();

    if (trimmedSearchTerm) {
      const normalizedQuery = removeAccents(trimmedSearchTerm.toLowerCase());
      nextCourses = nextCourses.filter((course) => {
        const normalizedTitle = removeAccents(course.title.toLowerCase());
        const normalizedCategory = course.category?.name
          ? removeAccents(course.category.name.toLowerCase())
          : '';
        const normalizedModalidad = course.modalidad?.name
          ? removeAccents(course.modalidad.name.toLowerCase())
          : '';
        const normalizedTypeCourse = course.typeCourse?.type
          ? removeAccents(course.typeCourse.type.toLowerCase())
          : '';

        return (
          normalizedTitle.includes(normalizedQuery) ||
          normalizedCategory.includes(normalizedQuery) ||
          normalizedModalidad.includes(normalizedQuery) ||
          normalizedTypeCourse.includes(normalizedQuery)
        );
      });
    }

    return nextCourses;
  }, [categoryValue, courses, searchTermValue]);

  const sortedCourses = useMemo(
    () => sortCourses(filteredCourses, sortValue),
    [filteredCourses, sortValue]
  );

  const calculatedTotalPages = Math.max(
    1,
    Math.ceil(sortedCourses.length / ITEMS_PER_PAGE)
  );

  const paginatedCourses = useMemo(() => {
    const safePage = Math.min(Math.max(pageValue, 1), calculatedTotalPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return sortedCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [calculatedTotalPages, pageValue, sortedCourses]);

  const processedCourses = useMemo(
    () =>
      paginatedCourses.map((course) => {
        // Handle image URL and blur data
        let imageUrl =
          'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
        if (course.coverImageKey && course.coverImageKey !== 'NULL') {
          imageUrl =
            `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd();
        }

        // Obtener próxima clase en vivo desde classMeetings si ya viene del back
        let nextLiveClassDate: string | null = null;
        if (
          (course as Course & { classMeetings?: ClassMeeting[] })
            .classMeetings &&
          Array.isArray(
            (course as Course & { classMeetings?: ClassMeeting[] })
              .classMeetings
          )
        ) {
          nextLiveClassDate = getNextLiveClassDateFromMeetings(course);
        }

        return { course, imageUrl, nextLiveClassDate };
      }),
    [paginatedCourses]
  );

  useEffect(() => {
    let isMounted = true;

    const loadCommentCounts = async () => {
      const courseIds = paginatedCourses.map((course) => course.id);

      if (courseIds.length === 0) {
        setCommentCountsByCourseId({});
        return;
      }

      const counts = await getCourseCommentCounts(courseIds);

      if (isMounted) {
        setCommentCountsByCourseId(counts);
      }
    };

    void loadCommentCounts();

    return () => {
      isMounted = false;
    };
  }, [paginatedCourses]);

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
            <div
              className="
                flex items-center gap-1 rounded-full border border-amber-500/30
                bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium
                text-amber-400
              "
            >
              <FaCrown className="size-3" />
              Premium
            </div>
          );
        }
        // PRO
        if ((userPlanType === 'Pro' || userPlanType === 'Premium') && hasPro) {
          return (
            <div
              className="
                flex items-center gap-1 rounded-full border border-blue-500/30
                bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400
              "
            >
              <FaStar className="size-3" />
              Pro
            </div>
          );
        }
        // GRATUITO
        if (hasFree) {
          return (
            <div
              className="
                flex items-center gap-1 rounded-full border
                border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px]
                font-medium text-emerald-400
              "
            >
              <IoGiftOutline className="size-3" />
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
            <div
              className="
                flex items-center gap-1 rounded-full border border-orange-500/30
                bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium
                text-orange-400
              "
            >
              <FaStar className="size-3" />${' '}
              {course.individualPrice
                ? course.individualPrice.toLocaleString('es-CO')
                : purchasableType?.price
                  ? purchasableType.price.toLocaleString('es-CO')
                  : 'Comprar'}
            </div>
          );
        }
      }
      // Lógica para usuario sin suscripción activa
      // 1. Individual (si existe)
      if (hasPurchasable) {
        const purchasableType = course.courseTypes.find(
          (type) => type.isPurchasableIndividually
        );
        return (
          <div
            className="
              flex items-center gap-1 rounded-full border border-orange-500/30
              bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium
              text-orange-400
            "
          >
            <FaStar className="size-3" />${' '}
            {course.individualPrice
              ? course.individualPrice.toLocaleString('es-CO')
              : purchasableType?.price
                ? purchasableType.price.toLocaleString('es-CO')
                : 'Comprar'}
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
            <div
              className="
                flex items-center gap-1 rounded-full border border-red-500/30
                bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400
              "
            >
              <AiOutlineFire className="size-3" />
              {formattedPlans}
            </div>
          );
        }
        return (
          <div
            className="
              flex items-center gap-1 rounded-full border border-amber-500/30
              bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400
            "
          >
            <FaCrown className="size-3" />
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
            <div
              className="
                flex items-center gap-1 rounded-full border border-red-500/30
                bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400
              "
            >
              <AiOutlineFire className="size-3" />
              {formattedPlans}
            </div>
          );
        }
        return (
          <div
            className="
              flex items-center gap-1 rounded-full border border-blue-500/30
              bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400
            "
          >
            <FaStar className="size-3" />
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
            <div
              className="
                flex items-center gap-1 rounded-full border border-red-500/30
                bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400
              "
            >
              <AiOutlineFire className="size-3" />
              {formattedPlans}
            </div>
          );
        }
        return (
          <div
            className="
              flex items-center gap-1 rounded-full border border-emerald-500/30
              bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium
              text-emerald-400
            "
          >
            <IoGiftOutline className="size-3" />
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
        <div
          className="
            flex items-center gap-1 rounded-full border border-orange-500/30
            bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400
          "
        >
          <FaStar className="size-3" />${' '}
          {course.individualPrice.toLocaleString('es-CO')}
        </div>
      );
    }
    const { requiredSubscriptionLevel } = courseType;
    if (requiredSubscriptionLevel === 'none') {
      return (
        <div
          className="
            flex items-center gap-1 rounded-full border border-emerald-500/30
            bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium
            text-emerald-400
          "
        >
          <IoGiftOutline className="size-3" />
          Gratuito
        </div>
      );
    }
    if (requiredSubscriptionLevel === 'premium') {
      return (
        <div
          className="
            flex items-center gap-1 rounded-full border border-amber-500/30
            bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400
          "
        >
          <FaCrown className="size-3" />
          Premium
        </div>
      );
    }
    return (
      <div
        className="
          flex items-center gap-1 rounded-full border border-blue-500/30
          bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400
        "
      >
        <FaStar className="size-3" />
        Pro
      </div>
    );
  };

  // Modifica getCourseTypeLabel para separar tipo principal y badges "Incluido en"
  const _getCourseTypeLabelMobile = (course: Course) => {
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
            <div
              className="
                flex items-center gap-1 rounded-full border border-amber-500/30
                bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium
                text-amber-400
              "
            >
              <FaCrown className="size-3" />
              Premium
            </div>
          );
        } else if (
          (userPlanType === 'Pro' || userPlanType === 'Premium') &&
          hasPro
        ) {
          principalType = (
            <div
              className="
                flex items-center gap-1 rounded-full border border-blue-500/30
                bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400
              "
            >
              <FaCrown className="size-3" />
              Pro
            </div>
          );
        } else if (hasFree) {
          principalType = (
            <div
              className="
                flex items-center gap-1 rounded-full border
                border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px]
                font-medium text-emerald-400
              "
            >
              <IoGiftOutline className="size-3" />
              Gratuito
            </div>
          );
        } else if (hasPurchasable) {
          const purchasableType = course.courseTypes.find(
            (type) => type.isPurchasableIndividually
          );
          principalType = (
            <div
              className="
                flex items-center gap-1 rounded-full border border-orange-500/30
                bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium
                text-orange-400
              "
            >
              <FaStar className="size-3" />${' '}
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
            <div
              className="
                flex items-center gap-1 rounded-full border border-orange-500/30
                bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium
                text-orange-400
              "
            >
              <FaStar className="size-3" />${' '}
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
              <div
                className="
                  flex items-center gap-1 rounded-full border border-red-500/30
                  bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400
                "
              >
                <AiOutlineFire className="size-3" />
                {formattedPlans}
              </div>
            );
          } else {
            principalType = (
              <div
                className="
                  flex items-center gap-1 rounded-full border
                  border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px]
                  font-medium text-amber-400
                "
              >
                <FaCrown className="size-3" />
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
              <div
                className="
                  flex items-center gap-1 rounded-full border border-red-500/30
                  bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400
                "
              >
                <AiOutlineFire className="size-3" />
                {formattedPlans}
              </div>
            );
          } else {
            principalType = (
              <div
                className="
                  flex items-center gap-1 rounded-full border border-blue-500/30
                  bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium
                  text-blue-400
                "
              >
                <FaCrown className="size-3" />
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
              <div
                className="
                  flex items-center gap-1 rounded-full border border-red-500/30
                  bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400
                "
              >
                <AiOutlineFire className="size-3" />
                {formattedPlans}
              </div>
            );
          } else {
            principalType = (
              <div
                className="
                  flex items-center gap-1 rounded-full border
                  border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5
                  text-[10px] font-medium text-emerald-400
                "
              >
                <IoGiftOutline className="size-3" />
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
    <div id={sectionId}>
      <div
        className="
          mt-8 mb-3 flex flex-col gap-4 px-8
          sm:mb-3 sm:flex-row sm:items-center sm:justify-between
          lg:px-26
        "
      >
        <div className="flex items-center gap-2">
          <HiLibrary className="text-xl text-white" />
          <GradientText
            className="
              text-2xl
              sm:text-3xl
            "
          >
            Cursos Artie
          </GradientText>
        </div>
        <CourseSortControl
          value={sortValue}
          onSortChange={(nextSort: CourseSortValue) => {
            setSortValue(nextSort);
            setPageValue(1);
          }}
        />
      </div>
      <div
        className="
          relative z-0 mb-8 grid grid-cols-1 gap-4 px-8
          sm:grid-cols-2
          lg:grid-cols-4 lg:px-26
        "
      >
        {processedCourses.map(({ course, imageUrl, nextLiveClassDate }) => {
          const hasLiveClass = Boolean(nextLiveClassDate);
          const courseRating = course.rating ?? 0;
          const hasRealRating =
            (commentCountsByCourseId[course.id] ?? 0) > 0 && courseRating > 0;
          const typeCourseLabel = course.typeCourse?.type?.trim();
          const modalidadLabel = course.modalidad?.name ?? 'Asistida Virtual';
          const nivelLabel = course.nivel?.name ?? 'Sin nivel';
          const categoryLabel = course.category?.name?.trim();

          const cardContent = (
            <div
              className={`
                artiefy-course-card zoom-in relative flex h-full flex-col
                overflow-hidden rounded-2xl border border-border/50 bg-card
                text-foreground transition-all duration-300
                ${
                  course.isActive
                    ? `
                      cursor-pointer
                      hover:-translate-y-1 hover:border-primary/30
                      hover:shadow-[0_8px_32px_hsl(var(--primary)/0.15)]
                    `
                    : 'cursor-not-allowed'
                }
              `}
            >
              <div className="relative h-40 overflow-hidden bg-card">
                <Image
                  src={imageUrl}
                  alt={course.title || 'Imagen del curso'}
                  className="
                    size-full object-cover transition-transform duration-500
                    group-hover:scale-110
                  "
                  fill
                  placeholder="empty"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={75}
                />
                <div
                  className="
                    absolute top-0 right-0 bottom-[-8px] left-0 bg-gradient-to-t
                    from-card via-card/70 to-transparent
                  "
                />
                <div
                  className="
                    pointer-events-none absolute right-0 bottom-[-1px] left-0
                    h-4 bg-gradient-to-t from-card via-card/95 to-transparent
                  "
                />
                {typeCourseLabel && (
                  <span
                    className="
                      absolute bottom-3 left-3 rounded-full border
                      border-primary/30 bg-primary/20 px-3 py-1 text-[11px]
                      font-semibold text-primary backdrop-blur-sm
                    "
                  >
                    {typeCourseLabel}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3
                  className="
                    line-clamp-2 text-base leading-snug font-bold
                    text-foreground transition-colors duration-200
                    group-hover:text-primary
                  "
                >
                  {course.title}
                </h3>

                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs text-muted-foreground">
                    Por{' '}
                    <span className="font-medium text-foreground/80">
                      {course.instructorName ?? 'Educador'}
                    </span>
                  </p>
                  <div className="flex shrink-0 items-center">
                    {getCourseTypeLabel(course)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="
                      rounded-full border border-accent/20 bg-accent/10 px-2.5
                      py-0.5 text-[10px] font-medium text-accent
                    "
                  >
                    {modalidadLabel}
                  </span>
                  <span
                    className="
                      rounded-full border border-white/10 bg-white/8 px-2.5
                      py-0.5 text-[10px] font-medium text-foreground/90
                    "
                  >
                    {nivelLabel}
                  </span>
                </div>

                {categoryLabel && (
                  <div className="flex">
                    <span
                      className="
                        rounded-full border border-cyan-400/20 bg-cyan-400/10
                        px-2.5 py-0.5 text-[10px] font-medium text-cyan-300
                      "
                    >
                      {categoryLabel}
                    </span>
                  </div>
                )}

                <div
                  className="
                    mt-auto flex items-center justify-between pt-2 text-xs
                    text-muted-foreground
                  "
                >
                  {hasLiveClass && nextLiveClassDate ? (
                    <span className="flex items-center gap-1">
                      <span
                        className="
                          relative mr-0.5 flex size-2 items-center
                          justify-center
                        "
                      >
                        <span
                          className="
                            absolute inline-flex size-3 animate-ping
                            rounded-full bg-red-500/45 blur-[1px]
                          "
                        />
                        <span
                          className="
                            absolute inline-flex size-2.5 animate-pulse
                            rounded-full bg-red-500/50
                          "
                        />
                        <span
                          className="
                            relative inline-flex size-2 rounded-full bg-red-500
                            shadow-[0_0_10px_rgba(239,68,68,0.9)]
                          "
                        />
                      </span>
                      <CalendarDays className="size-3.5 text-primary/60" />
                      <span className="font-medium text-foreground/85">
                        {formatShortSpanishDate(nextLiveClassDate)}
                      </span>
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  {hasRealRating ? (
                    <span
                      className="
                        flex items-center gap-1 font-semibold
                        text-[hsl(45,100%,60%)]
                      "
                    >
                      <FaStar className="size-3.5 fill-[hsl(45,100%,60%)]" />
                      {courseRating.toFixed(1)}
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>
          );

          const cardWrapperClass =
            'block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2';

          return (
            <div key={course.id} className="relative">
              {course.isActive ? (
                <Link
                  href={`/estudiantes/cursos/${course.id}`}
                  aria-label={`Ver detalles del curso ${course.title}`}
                  className={`
                    group
                    ${cardWrapperClass}
                  `}
                >
                  {cardContent}
                </Link>
              ) : (
                <div className="group relative h-full rounded-2xl opacity-80">
                  {cardContent}
                  <div
                    className="
                      pointer-events-none absolute inset-0 flex items-center
                      justify-center rounded-2xl bg-black/40 text-lg
                      font-semibold
                    "
                  >
                    Muy pronto
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <StudentPagination
        totalPages={calculatedTotalPages}
        currentPage={Math.min(pageValue, calculatedTotalPages)}
        totalCourses={sortedCourses.length}
        route="/estudiantes"
        category={categoryValue ?? undefined}
        searchTerm={searchTermValue || undefined}
        sort={sortValue}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPageValue}
      />
    </div>
  );
}
