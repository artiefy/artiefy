import { Suspense } from 'react';
import { getAllCourses, getAllCategories, getFeaturedCategories } from '~/server/actions/studentActions';
import StudentDashboard from './index';
import { LoadingCourses } from '~/components/estudiantes/layout/LoadingCourses';
import CourseListStudent from '~/components/estudiantes/layout/CourseListStudent';
import CourseCategories from '~/components/estudiantes/layout/CourseCategories';
import { type Course, type Category } from '~/types';

interface SearchParams {
  category?: string;
  searchTerm?: string;
}

interface CoursesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { category, searchTerm } = await searchParams;
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

  return (
    <Suspense fallback={<LoadingCourses />}>
      <StudentDashboard initialCourses={courses}>
        <CourseCategories
          allCategories={allCategories}
          featuredCategories={featuredCategories}
        />
        <CourseListStudent courses={filteredCourses} />
      </StudentDashboard>
    </Suspense>
  );
}
