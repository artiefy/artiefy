import React from 'react';

import StudentDashboard from '~/app/estudiantes/StudentDashboard';
import CourseCategories from '~/components/estudiantes/layout/CourseCategories';
import CourseListStudent from '~/components/estudiantes/layout/CourseListStudent';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getAllCategories } from '~/server/actions/categories/getAllCategories';
import { getFeaturedCategories } from '~/server/actions/categories/getFeaturedCategories';
import { getAllCourses } from '~/server/actions/courses/getAllCourses';
import type { Category, Course } from '~/types';

interface SearchParams {
  category?: string;
  query?: string;
  page?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

interface APIResponse {
  courses: Course[];
  categories: Category[];
  featuredCategories: Category[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categoryId?: number;
  searchTerm?: string;
}

const ITEMS_PER_PAGE = 9;

async function fetchCourseData(params: SearchParams): Promise<APIResponse> {
  const [allCourses, allCategories, featuredCategories] = await Promise.all([
    getAllCourses(),
    getAllCategories(),
    getFeaturedCategories(6),
  ]);

  let filteredCourses = allCourses;

  if (params.category) {
    const categoryId = Number(params.category);
    filteredCourses = filteredCourses.filter(
      (course) => course.categoryid === categoryId
    );
  }

  if (params.query) {
    const lowercasedQuery = params.query.toLowerCase();
    filteredCourses = filteredCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(lowercasedQuery) ||
        course.description?.toLowerCase().includes(lowercasedQuery) ||
        course.category?.name.toLowerCase().includes(lowercasedQuery)
    );
  }

  const totalFilteredCourses = filteredCourses.length;
  const totalPages = Math.ceil(totalFilteredCourses / ITEMS_PER_PAGE);
  const page = Number(params.page ?? '1');
  const paginatedCourses = filteredCourses.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return {
    courses: paginatedCourses,
    categories: allCategories,
    featuredCategories,
    total: totalFilteredCourses,
    page,
    pageSize: ITEMS_PER_PAGE,
    totalPages,
    categoryId: params.category ? Number(params.category) : undefined,
    searchTerm: params.query,
  };
}

export default async function CoursesPage({ searchParams }: Props) {
  try {
    const params = await searchParams;
    const data = await fetchCourseData(params);

    return (
      <>
        <Header />
        <StudentDashboard initialCourses={data.courses} />
            <CourseCategories
              allCategories={data.categories}
              featuredCategories={data.featuredCategories}
            />
          <CourseListStudent
            courses={data.courses}
            currentPage={data.page}
            totalPages={data.totalPages}
            totalCourses={data.total}
            category={data.categoryId?.toString()}
            searchTerm={data.searchTerm}
          />
        <Footer />
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

export const revalidate = 60;
export const dynamic = 'force-dynamic';
