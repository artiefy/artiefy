import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { ProfileView } from '~/components/estudiantes/profile/ProfileView';
import { getPublicProjectsByOwner } from '~/components/estudiantes/proyectos/projectSocialData';
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

  const { userId } = await auth();
  const [courses, programs, projects] = await Promise.all([
    getEnrolledCourses(),
    getEnrolledPrograms(),
    // Viewer and owner are the same person here, so private and draft
    // projects are included.
    userId ? getPublicProjectsByOwner(userId, userId) : Promise.resolve([]),
  ]);

  return (
    <>
      <ProfileView
        profile={profile}
        courses={courses}
        programs={programs}
        projects={projects}
      />
    </>
  );
}
