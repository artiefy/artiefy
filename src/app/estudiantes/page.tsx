import { Suspense } from 'react';
import { getAllCourses } from '~/server/actions/studentActions';
import StudentDashboard from './index';
import { LoadingCourses } from '~/components/estudiantes/layout/LoadingCourses';

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <Suspense fallback={<LoadingCourses />}>
      <StudentDashboard initialCourses={courses} />
    </Suspense>
  );
}

