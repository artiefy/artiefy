import { redirect } from 'next/navigation';

import { ProfileView } from '~/components/estudiantes/profile/ProfileView';
import { getEnrolledCourses } from '~/server/actions/estudiantes/courses/getEnrolledCourses';
import { getMyProfile } from '~/server/actions/estudiantes/profile/profileActions';
import { getEnrolledPrograms } from '~/server/actions/estudiantes/programs/getEnrolledPrograms';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
      <ProfileView profile={profile} courses={courses} programs={programs} />
    </>
  );
}
