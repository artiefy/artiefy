import { Suspense } from 'react';
import { getPaginatedCourses, getAllCategories, getFeaturedCategories, getAllCourses } from '~/server/actions/studentActions';
import StudentDashboard from './index';
import { LoadingCourses } from '~/components/estudiantes/layout/LoadingCourses';
import CourseCategories from '~/components/estudiantes/layout/CourseCategories';
import CourseListStudent from '~/components/estudiantes/layout/CourseListStudent';

const ITEMS_PER_PAGE = 9;

type SearchParams = Promise<{ 
  category?: string;
  searchTerm?: string;
  page?: string;
}>

interface Props {
  searchParams: SearchParams;
}

export default async function CoursesPage({ searchParams }: Props) {
  const params = await searchParams;
  
  const currentPage = params?.page ? parseInt(params.page, 10) : 1;
  const categoryId = params?.category ? parseInt(params.category, 10) : undefined;
  const searchTerm = params?.searchTerm;

  try {
    const [coursesData, allCategories, featuredCategories, latestCourses] = await Promise.all([
      getPaginatedCourses({ 
        pagenum: currentPage, 
        categoryId, 
        searchTerm 
      }),
      getAllCategories(),
      getFeaturedCategories(6),
      getAllCourses({ pagenum: 0, limit: 15 })
    ]);

    return (
      <Suspense fallback={<LoadingCourses />}>
        <StudentDashboard initialCourses={latestCourses.courses}>
          <CourseCategories
            allCategories={allCategories}
            featuredCategories={featuredCategories}
          />
          <CourseListStudent 
            courses={coursesData.courses} 
            currentPage={currentPage} 
            totalPages={Math.ceil(coursesData.total / ITEMS_PER_PAGE)}
            totalCourses={coursesData.total}
            category={params.category}
            searchTerm={searchTerm}
          />
        </StudentDashboard>
      </Suspense>
    );
  } catch (error) {
    console.error('Error al cargar los cursos:', error);
    return <div>Error al cargar los cursos. Por favor, intenta de nuevo más tarde.</div>;
  }
}