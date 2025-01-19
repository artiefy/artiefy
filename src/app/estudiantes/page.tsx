import { Suspense } from 'react';
import { getAllCourses, getAllCategories, getFeaturedCategories } from '~/server/actions/studentActions';
import StudentDashboard from './index';
import { LoadingCourses } from '~/components/estudiantes/layout/LoadingCourses';
import CourseCategories from '~/components/estudiantes/layout/CourseCategories';
import CourseListStudent from '~/components/estudiantes/layout/CourseListStudent';
import { type Course, type Category } from '~/types';

interface SearchParams {
  category?: string;
  searchTerm?: string;
  page?: string;
}

interface CoursesPageProps {
  searchParams: Promise<SearchParams>;
}

const ITEMS_PER_PAGE = 9;

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { category, searchTerm, page } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;
  const courses: Course[] = await getAllCourses();
  const allCategories: Category[] = await getAllCategories();
  const featuredCategories: Category[] = await getFeaturedCategories(6);

  let filteredCourses = courses;

  if (category) {
    filteredCourses = filteredCourses.filter((course) => course.category?.name === category);
  }

  if (searchTerm) {
    const lowercasedTerm = searchTerm.toLowerCase();
    filteredCourses = filteredCourses.filter(
      (course) =>
        (course.title.toLowerCase().includes(lowercasedTerm) ||
          course.description?.toLowerCase().includes(lowercasedTerm)) ??
        false
    );
  }

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Suspense fallback={<LoadingCourses />}>
      <StudentDashboard initialCourses={courses}>
        <CourseCategories
          allCategories={allCategories}
          featuredCategories={featuredCategories}
        />
        <CourseListStudent courses={paginatedCourses} currentPage={currentPage} totalPages={totalPages} />
      </StudentDashboard>
    </Suspense>
  );
}
