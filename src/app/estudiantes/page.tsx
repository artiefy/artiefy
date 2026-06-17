import { Suspense } from 'react';

import StudentDetails from '~/app/estudiantes/StudentDetails';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { CourseListWrapper } from '~/components/estudiantes/layout/studentdashboard/CourseListWrapper';
import StudentCategories from '~/components/estudiantes/layout/studentdashboard/StudentCategories';
import StudentListCourses from '~/components/estudiantes/layout/studentdashboard/StudentListCourses';
import { Reveal } from '~/components/estudiantes/ui/Reveal';
import { Skeleton } from '~/components/estudiantes/ui/skeleton';
import { getAllCategories } from '~/server/actions/estudiantes/categories/getAllCategories';
import { getFeaturedCategories } from '~/server/actions/estudiantes/categories/getFeaturedCategories';
import {
  getAllLearningItems,
  type UnifiedItem,
} from '~/server/actions/estudiantes/getAllLearningItems';
import { getAllPrograms } from '~/server/actions/estudiantes/programs/getAllPrograms';

import type { CourseSortValue } from '~/components/estudiantes/layout/studentdashboard/CourseSortControl';
import type { Category, Program } from '~/types';

interface SearchParams {
  category?: string;
  query?: string;
  page?: string;
  view?: string;
  sort?: CourseSortValue;
}

interface APIResponse {
  courses: UnifiedItem[];
  allCourses: UnifiedItem[];
  programs: Program[];
  categories: Category[];
  featuredCategories: Category[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categoryId?: number;
  searchTerm?: string;
}

const ITEMS_PER_PAGE = 12;

// Add this helper function before the fetchData function
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function fetchData(
  params: SearchParams | undefined
): Promise<APIResponse> {
  const [allLearningItems, allCategories, featuredCategories, allPrograms] =
    await Promise.all([
      getAllLearningItems(),
      getAllCategories(),
      getFeaturedCategories(7),
      getAllPrograms(),
    ]);

  let filteredCourses = allLearningItems;

  if (params?.category) {
    const categoryId = Number(params.category);
    filteredCourses = filteredCourses.filter(
      (item) => item.categoryid === categoryId
    );
  }

  if (params?.query) {
    const normalizedQuery = removeAccents(params.query.toLowerCase());
    filteredCourses = filteredCourses.filter((item) => {
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

      // Solo buscar en título, categoría y modalidad
      return (
        normalizedTitle.includes(normalizedQuery) ||
        normalizedCategory.includes(normalizedQuery) ||
        normalizedModalidad.includes(normalizedQuery) ||
        normalizedTypeCourse.includes(normalizedQuery)
      );
    });
  }

  const totalFilteredCourses = filteredCourses.length;
  const totalPages = Math.ceil(totalFilteredCourses / ITEMS_PER_PAGE);
  const page = Number(params?.page ?? '1');

  return {
    courses: filteredCourses,
    allCourses: allLearningItems,
    programs: allPrograms, // Ensure programs are included
    categories: allCategories,
    featuredCategories,
    total: totalFilteredCourses,
    page,
    pageSize: ITEMS_PER_PAGE,
    totalPages,
    categoryId: params?.category ? Number(params.category) : undefined,
    searchTerm: params?.query,
  };
}

interface PageProps {
  searchParams?:
    | {
        category?: string;
        query?: string;
        page?: string;
        view?: string;
        sort?: CourseSortValue;
      }
    | Promise<{
        category?: string;
        query?: string;
        page?: string;
        view?: string;
        sort?: CourseSortValue;
      }>;
}

export default async function Page({ searchParams }: PageProps) {
  // Await searchParams if it's a Promise (Next.js 16)
  const params =
    searchParams instanceof Promise ? await searchParams : (searchParams ?? {});

  const parsedParams: SearchParams = {
    category: params?.category,
    query: params?.query,
    page: params?.page,
    view: params?.view,
    sort: params?.sort,
  };

  try {
    const data = await fetchData(parsedParams);
    const view = parsedParams.view;

    return (
      <>
        <div
          className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden"
          style={{ isolation: 'isolate', zIndex: 1 }}
        >
          <Header />
          <StudentDetails
            initialCourses={data.allCourses}
            initialPrograms={data.programs}
          />
          {!view && (
            <>
              <Reveal>
                <StudentCategories
                  allCategories={data.categories}
                  featuredCategories={data.featuredCategories}
                />
              </Reveal>
              <Reveal>
                <CourseListWrapper>
                  <Suspense
                    fallback={
                      <div
                        className="
                        my-8 grid grid-cols-1 gap-6 px-8
                        sm:grid-cols-2
                        lg:grid-cols-4 lg:px-20
                      "
                      >
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="group relative p-4">
                            <Skeleton
                              className="
                              relative h-40 w-full
                              md:h-56
                            "
                            />
                            <div className="mt-3 flex flex-col space-y-2">
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <StudentListCourses
                      courses={data.allCourses}
                      currentPage={data.page}
                      totalPages={data.totalPages}
                      totalCourses={data.total}
                      category={data.categoryId?.toString()}
                      searchTerm={data.searchTerm}
                      sort={parsedParams.sort ?? 'random'}
                    />
                  </Suspense>
                </CourseListWrapper>
              </Reveal>
            </>
          )}
          <Footer />
        </div>
      </>
    );
  } catch (error) {
    console.error('Error al cargar los cursos:', error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold">Error al cargar los Cursos</h2>
          <p>Por favor, intenta de nuevo más tarde.</p>
        </div>
      </div>
    );
  }
}
