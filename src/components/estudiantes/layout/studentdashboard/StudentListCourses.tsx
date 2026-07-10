'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CalendarDays } from 'lucide-react';
import { FaCrown, FaStar } from 'react-icons/fa';
import { HiLibrary } from 'react-icons/hi';
import { IoGiftOutline } from 'react-icons/io5';

import CourseSortControl from '~/components/estudiantes/layout/studentdashboard/CourseSortControl';
import GradientText from '~/components/estudiantes/layout/studentdashboard/StudentGradientText';
import { RevealStagger } from '~/components/estudiantes/ui/RevealStagger';
import { getCourseCommentCounts } from '~/server/actions/estudiantes/comment/courseCommentActions';
import { type UnifiedItem } from '~/server/actions/estudiantes/getAllLearningItems';

import StudentPagination from './StudentPagination';

import type { CourseSortValue } from '~/components/estudiantes/layout/studentdashboard/CourseSortControl';
import type { ClerkUser } from '~/types';
import type { Course } from '~/types';

interface CourseListStudentProps {
  courses: UnifiedItem[];
  currentPage: number;
  totalPages: number;
  totalCourses: number;
  sectionId?: string;
  syncWithUrl?: boolean;
  category?: string;
  searchTerm?: string;
  sort?: CourseSortValue;
  user?: ClerkUser;
}

const ITEMS_PER_PAGE = 12;
const COURSE_SORT_VALUES = [
  'random',
  'az',
  'created',
  'category',
  'guided-projects',
] as const;

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isCourseSortValue(value: string | null): value is CourseSortValue {
  return COURSE_SORT_VALUES.includes(value as CourseSortValue);
}

function getCourseImageUrl(imageKey: string | null | undefined): string {
  if (!imageKey || imageKey === 'NULL') {
    return 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';
  }

  const s3Url = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${imageKey}`.trimEnd();
  return `/api/image-proxy?url=${encodeURIComponent(s3Url)}`;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

function sortCourses(
  courses: UnifiedItem[],
  sort: CourseSortValue
): UnifiedItem[] {
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
      const typeA = a.typeCourse?.type ?? a.category?.name ?? '';
      const typeB = b.typeCourse?.type ?? b.category?.name ?? '';
      const typeCompare = typeA.localeCompare(typeB, 'es', {
        sensitivity: 'base',
      });

      if (typeCompare !== 0) return typeCompare;

      return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    });
  }

  if (sort === 'guided-projects') {
    return [...courses].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

  useEffect(() => {
    if (!syncWithUrl) return;

    const handleReset = () => {
      setPageValue(1);
      setCategoryValue(null);
      setSearchTermValue('');
    };

    window.addEventListener('student-courses-reset', handleReset);

    return () => {
      window.removeEventListener('student-courses-reset', handleReset);
    };
  }, [syncWithUrl]);

  function formatShortSpanishDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Bogota',
    });
  }

  function getNextLiveClassDateFromMeetings(item: UnifiedItem): string | null {
    if (item.isGuidedProject) return null;
    const course = item as Course & {
      classMeetings?: Array<{
        startDateTime?: string;
        video_key?: string | null;
      }>;
    };
    const meetings = course.classMeetings ?? [];
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
    let nextItems = courses;

    if (categoryValue) {
      const categoryId = Number(categoryValue);
      nextItems = nextItems.filter((item) => item.categoryid === categoryId);
    }

    if (sortValue === 'guided-projects') {
      nextItems = nextItems.filter((item) => item.isGuidedProject === true);
    }

    const trimmedSearchTerm = searchTermValue.trim();

    if (trimmedSearchTerm) {
      const normalizedQuery = removeAccents(trimmedSearchTerm.toLowerCase());
      nextItems = nextItems.filter((item) => {
        const normalizedTitle = removeAccents(item.title.toLowerCase());
        const normalizedCategory = item.category?.name
          ? removeAccents(item.category.name.toLowerCase())
          : '';
        const normalizedModalidad = item.modalidad?.name
          ? removeAccents(item.modalidad.name.toLowerCase())
          : '';
        const normalizedTypeCourse = item.typeCourse?.type
          ? removeAccents(item.typeCourse.type.toLowerCase())
          : '';

        return (
          normalizedTitle.includes(normalizedQuery) ||
          normalizedCategory.includes(normalizedQuery) ||
          normalizedModalidad.includes(normalizedQuery) ||
          normalizedTypeCourse.includes(normalizedQuery)
        );
      });
    }

    return nextItems;
  }, [categoryValue, courses, searchTermValue, sortValue]);

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
      paginatedCourses.map((item) => {
        const imageUrl = getCourseImageUrl(item.coverImageKey);
        const nextLiveClassDate = getNextLiveClassDateFromMeetings(item);

        return { item, imageUrl, nextLiveClassDate };
      }),
    [paginatedCourses]
  );

  useEffect(() => {
    let isMounted = true;

    const loadCommentCounts = async () => {
      const courseIds = paginatedCourses
        .filter((i) => !i.isGuidedProject)
        .map((i) => i.id);

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

  const getCourseTypeLabel = (item: UnifiedItem) => {
    // Guided projects already show their badge over the cover image
    if (item.isGuidedProject || item.typeCourse?.id === 3) {
      return null;
    }

    const course = item as Course;
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

      const includedInPlans: string[] = [];
      if (course.courseTypes.length > 1) {
        if (hasPremium) includedInPlans.push('PREMIUM');
        if (hasPro) includedInPlans.push('PRO');
        if (hasFree) includedInPlans.push('GRATUITO');
      }

      if (hasActiveSubscription) {
        if (userPlanType === 'Premium' && hasPremium) {
          return (
            <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              <FaCrown className="size-3" />
              Premium
            </div>
          );
        }
        if ((userPlanType === 'Pro' || userPlanType === 'Premium') && hasPro) {
          return (
            <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              <FaStar className="size-3" />
              Pro
            </div>
          );
        }
        if (hasFree) {
          return (
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <IoGiftOutline className="size-3" />
              Gratuito
            </div>
          );
        }
      }

      if (hasPurchasable) {
        const purchasableType = course.courseTypes.find(
          (type) => type.isPurchasableIndividually
        );
        return (
          <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400">
            <FaStar className="size-3" />${' '}
            {course.individualPrice
              ? course.individualPrice.toLocaleString('es-CO')
              : (purchasableType?.price?.toLocaleString('es-CO') ?? 'Comprar')}
          </div>
        );
      }
    }

    const courseType = course.courseType;
    if (!courseType) return null;

    if (course.courseTypeId === 4 && course.individualPrice) {
      return (
        <div className="flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-400">
          <FaStar className="size-3" />${' '}
          {course.individualPrice.toLocaleString('es-CO')}
        </div>
      );
    }

    const { requiredSubscriptionLevel } = courseType;
    if (requiredSubscriptionLevel === 'none')
      return (
        <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          <IoGiftOutline className="size-3" />
          Gratuito
        </div>
      );
    if (requiredSubscriptionLevel === 'premium')
      return (
        <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
          <FaCrown className="size-3" />
          Premium
        </div>
      );
    return (
      <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
        <FaStar className="size-3" />
        Pro
      </div>
    );
  };

  return (
    <div id={sectionId}>
      <div className="mt-8 mb-3 flex flex-col gap-4 px-8 sm:mb-3 sm:flex-row sm:items-center sm:gap-6 lg:px-26">
        <div className="flex shrink-0 items-center gap-2">
          <HiLibrary className="text-xl text-white" />
          <GradientText className="text-2xl sm:text-3xl">
            Cursos Artie
          </GradientText>
        </div>
        <div className="w-full sm:ml-auto sm:w-[320px] lg:w-[360px]">
          <CourseSortControl
            value={sortValue}
            onSortChange={(nextSort: CourseSortValue) => {
              setSortValue(nextSort);
              setPageValue(1);
            }}
          />
        </div>
      </div>
      <RevealStagger className="relative z-0 mb-8 grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-26">
        {processedCourses.map(({ item, imageUrl, nextLiveClassDate }) => {
          const hasLiveClass = Boolean(nextLiveClassDate);
          const courseRating = item.rating ?? 0;
          const hasRealRating =
            !item.isGuidedProject &&
            (commentCountsByCourseId[item.id] ?? 0) > 0 &&
            courseRating > 0;
          const typeCourseLabel = item.typeCourse?.type?.trim();
          const modalidadLabel = item.modalidad?.name ?? 'Asistida Virtual';
          const nivelLabel = item.nivel?.name ?? 'Sin nivel';
          const categoryLabel = item.category?.name?.trim();
          const detailUrl = item.isGuidedProject
            ? `/estudiantes/proyectos-guiados/${item.id}`
            : `/estudiantes/cursos/${item.id}`;

          const cardContent = (
            <div
              className={`artiefy-course-card zoom-in relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card text-foreground transition-all duration-300 ${item.isActive ? 'cursor-pointer hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_32px_hsl(var(--primary)/0.15)]' : 'cursor-not-allowed'}`}
            >
              <div className="relative h-40 overflow-hidden bg-card">
                <Image
                  src={imageUrl}
                  alt={item.title || 'Imagen'}
                  className="size-full transform-gpu object-cover transition-transform duration-500 group-hover:scale-110"
                  fill
                  unoptimized={imageUrl.startsWith('/api/image-proxy')}
                  placeholder="empty"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={75}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
                {typeCourseLabel && (
                  <span className="absolute bottom-3 left-3 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-[11px] font-semibold text-primary backdrop-blur-sm">
                    {typeCourseLabel}
                  </span>
                )}
              </div>

              <div className="relative z-10 -mt-px flex flex-1 flex-col gap-2 bg-card p-4">
                <h3 className="line-clamp-2 text-base leading-snug font-bold text-foreground transition-colors duration-200 group-hover:text-primary">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs text-muted-foreground">
                    Por{' '}
                    <span className="font-medium text-foreground/80">
                      {item.instructorName ?? 'Educador'}
                    </span>
                  </p>
                  <div className="flex shrink-0 items-center">
                    {getCourseTypeLabel(item)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                    {modalidadLabel}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-0.5 text-[10px] font-medium text-foreground/90">
                    {nivelLabel}
                  </span>
                </div>
                {categoryLabel && (
                  <div className="flex">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-medium text-cyan-300">
                      {categoryLabel}
                    </span>
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  {hasLiveClass && nextLiveClassDate ? (
                    <span className="flex items-center gap-1">
                      <span className="relative mr-0.5 flex size-2 items-center justify-center">
                        <span className="absolute inline-flex size-3 animate-ping rounded-full bg-red-500/45 blur-[1px]" />
                        <span className="absolute inline-flex size-2.5 animate-pulse rounded-full bg-red-500/50" />
                        <span className="relative inline-flex size-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
                      </span>
                      <CalendarDays className="size-3.5 text-primary/60" />
                      <span className="font-medium text-foreground/85">
                        {formatShortSpanishDateTime(nextLiveClassDate)}
                      </span>
                    </span>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  {hasRealRating ? (
                    <span className="flex items-center gap-1 font-semibold text-[hsl(45,100%,60%)]">
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

          return (
            <div
              key={`${item.isGuidedProject ? 'gp' : 'c'}-${item.id}`}
              className="relative"
            >
              {item.isActive ? (
                <Link
                  href={detailUrl}
                  className="group block h-full rounded-2xl no-underline hover:no-underline focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {cardContent}
                </Link>
              ) : (
                <div className="group relative h-full overflow-hidden rounded-2xl opacity-90">
                  {cardContent}
                  {/* Diagonal 3D "Muy pronto" ribbon in the top-right corner */}
                  <div className="pointer-events-none absolute top-0 right-0 z-20 size-28 overflow-hidden rounded-tr-2xl">
                    <span className="absolute top-[22px] right-[-34px] w-[150px] rotate-45 border-t border-b border-yellow-200/80 border-b-yellow-700/60 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 py-1.5 text-center text-[11px] font-extrabold tracking-wide text-yellow-950 uppercase shadow-[0_4px_8px_rgba(0,0,0,0.5)] [text-shadow:0_1px_0_rgba(255,255,255,0.45)]">
                      Muy pronto
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </RevealStagger>
      <StudentPagination
        totalPages={calculatedTotalPages}
        currentPage={pageValue}
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
