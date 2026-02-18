import MyCoursesStudentClient from '~/components/estudiantes/layout/MyCoursesStudentClient';
import { getEnrolledCourses } from '~/server/actions/estudiantes/courses/getEnrolledCourses';
import { getEnrolledPrograms } from '~/server/actions/estudiantes/programs/getEnrolledPrograms';

export default async function MyCoursesStudent() {
  const courses = await getEnrolledCourses();
  const programs = await getEnrolledPrograms();

  return <MyCoursesStudentClient courses={courses} programs={programs} />;
}
