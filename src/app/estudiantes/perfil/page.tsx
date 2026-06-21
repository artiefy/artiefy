import { redirect } from 'next/navigation';

import { Header } from '~/components/estudiantes/layout/Header';
import { ProfileView } from '~/components/estudiantes/profile/ProfileView';
import { getEnrolledCourses } from '~/server/actions/estudiantes/courses/getEnrolledCourses';
import { getMyProfile } from '~/server/actions/estudiantes/profile/profileActions';
import { getEnrolledPrograms } from '~/server/actions/estudiantes/programs/getEnrolledPrograms';

export default async function ProfilePage() {
  const profile = await getMyProfile();

  if (!profile) {
    redirect('/sign-in?redirect_url=/estudiantes/perfil');
  }

  const [courses, programs] = await Promise.all([
    getEnrolledCourses(),
    getEnrolledPrograms(),
  ]);

  return (
    <>
      <Header />
      <ProfileView profile={profile} courses={courses} programs={programs} />
    </>
  );
}
