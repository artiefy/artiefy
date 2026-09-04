import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { ProfileView } from '~/components/estudiantes/profile/ProfileView';
import {
  countCommunityPostsByAuthor,
  getCommunityPostsByAuthor,
  getPublicProjectsByOwner,
} from '~/components/estudiantes/proyectos/projectSocialData';
import { getEnrolledCourses } from '~/server/actions/estudiantes/courses/getEnrolledCourses';
import { getMyProfile } from '~/server/actions/estudiantes/profile/profileActions';
import { getEnrolledPrograms } from '~/server/actions/estudiantes/programs/getEnrolledPrograms';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// Igual que el `limit` por defecto de `GET /api/community-posts`, que es de
// donde "Ver más posts" trae las páginas siguientes.
const POSTS_PAGE_SIZE = 20;

export default async function ProfilePage() {
  const profile = await getMyProfile();

  if (!profile) {
    redirect('/sign-in?redirect_url=/estudiantes/perfil');
  }

  const { userId } = await auth();
  const [courses, programs, projects, postsPage, postsCount] =
    await Promise.all([
      getEnrolledCourses(),
      getEnrolledPrograms(),
      // Viewer and owner are the same person here, so private and draft
      // projects are included.
      userId ? getPublicProjectsByOwner(userId, userId) : Promise.resolve([]),
      // First page of the owner's community posts — course projects,
      // standalone projects and general posts all live in the same table, so
      // one query covers every kind.
      userId
        ? getCommunityPostsByAuthor(userId, userId, POSTS_PAGE_SIZE)
        : Promise.resolve({ items: [], hasMore: false }),
      userId ? countCommunityPostsByAuthor(userId) : Promise.resolve(0),
    ]);

  return (
    <>
      <ProfileView
        profile={profile}
        courses={courses}
        programs={programs}
        projects={projects}
        posts={postsPage.items}
        postsHasMore={postsPage.hasMore}
        postsCount={postsCount}
      />
    </>
  );
}
