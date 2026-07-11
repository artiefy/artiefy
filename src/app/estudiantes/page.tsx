import { Suspense } from 'react';

import {
  CategoriesSkeleton,
  CourseGridSkeleton,
  StudentDetailsSkeleton,
} from '~/app/estudiantes/CourseCatalogSkeletons';
import { ScrollRestoration } from '~/app/estudiantes/ScrollRestoration';
import StudentDetails from '~/app/estudiantes/StudentDetails';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { CourseListWrapper } from '~/components/estudiantes/layout/studentdashboard/CourseListWrapper';
import StudentCategories from '~/components/estudiantes/layout/studentdashboard/StudentCategories';
import StudentListCourses from '~/components/estudiantes/layout/studentdashboard/StudentListCourses';
import { Reveal } from '~/components/estudiantes/ui/Reveal';
import { getAllCategories } from '~/server/actions/estudiantes/categories/getAllCategories';
import { getFeaturedCategories } from '~/server/actions/estudiantes/categories/getFeaturedCategories';
import { getAllLearningItems } from '~/server/actions/estudiantes/getAllLearningItems';
import { getAllPrograms } from '~/server/actions/estudiantes/programs/getAllPrograms';

import type { CourseSortValue } from '~/components/estudiantes/layout/studentdashboard/CourseSortControl';

interface SearchParams {
  category?: string;
  query?: string;
  page?: string;
  view?: string;
  sort?: CourseSortValue;
}

const ITEMS_PER_PAGE = 12;

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Each section below is an async Server Component that awaits only its own
// data. Wrapped in sibling <Suspense> boundaries in the page, they stream in
// independently instead of blocking the whole route on the slowest query.
// getAllLearningItems is cached, so the two sections that read it share a
// single execution per request.

async function StudentDetailsSection() {
  const [courses, programs] = await Promise.all([
    getAllLearningItems(),
    getAllPrograms(),
  ]);

  return <StudentDetails initialCourses={courses} initialPrograms={programs} />;
}

async function CategoriesSection() {
  try {
    const [categories, featuredCategories] = await Promise.all([
      getAllCategories(),
      getFeaturedCategories(7),
    ]);

    return (
      <Reveal>
        <StudentCategories
          allCategories={categories}
          featuredCategories={featuredCategories}
        />
      </Reveal>
    );
  } catch (error) {
    // Categories are non-critical: if the lookup fails, hide the section
    // rather than failing the whole page.
    console.error('Error loading categories section:', error);
    return null;
  }
}

async function CoursesListSection({ params }: { params: SearchParams }) {
  const allLearningItems = await getAllLearningItems();

  let filteredItems = allLearningItems;

  if (params.category) {
    const categoryId = Number(params.category);
    filteredItems = filteredItems.filter(
      (item) => item.categoryid === categoryId
    );
  }

  if (params.query) {
    const normalizedQuery = removeAccents(params.query.toLowerCase());
    filteredItems = filteredItems.filter((item) => {
      const title = removeAccents(item.title.toLowerCase());
      const category = item.category?.name
        ? removeAccents(item.category.name.toLowerCase())
        : '';
      const modalidad = item.modalidad?.name
        ? removeAccents(item.modalidad.name.toLowerCase())
        : '';
      const typeCourse = item.typeCourse?.type
        ? removeAccents(item.typeCourse.type.toLowerCase())
        : '';

      return (
        title.includes(normalizedQuery) ||
        category.includes(normalizedQuery) ||
        modalidad.includes(normalizedQuery) ||
        typeCourse.includes(normalizedQuery)
      );
    });
  }

  const totalCourses = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCourses / ITEMS_PER_PAGE));
  const page = Number(params.page ?? '1');

  return (
    <StudentListCourses
      courses={allLearningItems}
      currentPage={page}
      totalPages={totalPages}
      totalCourses={totalCourses}
      category={params.category}
      searchTerm={params.query}
      sort={params.sort ?? 'random'}
    />
  );
}

interface PageProps {
  searchParams?: Promise<SearchParams> | SearchParams;
}

export default async function Page({ searchParams }: PageProps) {
  // Await searchParams if it's a Promise (Next.js 16)
  const params =
    searchParams instanceof Promise ? await searchParams : (searchParams ?? {});
  const view = params?.view;

  return (
    <div
      className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden"
      style={{ isolation: 'isolate', zIndex: 1 }}
    >
      <ScrollRestoration />
      <Header />

      <Suspense fallback={<StudentDetailsSkeleton />}>
        <StudentDetailsSection />
      </Suspense>

      {!view && (
        <>
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesSection />
          </Suspense>
          <CourseListWrapper>
            <Suspense fallback={<CourseGridSkeleton count={12} />}>
              <CoursesListSection params={params} />
            </Suspense>
          </CourseListWrapper>
        </>
      )}

      <Footer />
    </div>
  );
}
