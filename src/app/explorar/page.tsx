import { auth } from '@clerk/nextjs/server';

import Footer from '~/components/estudiantes/layout/Footer';
import {
  getCommunityPostsFeed,
  getProjectSocialCollections,
} from '~/components/estudiantes/proyectos/projectSocialData';
import { ProjectsSocialView } from '~/components/estudiantes/proyectos/ProjectsSocialView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** The community projects feed: every public project plus community posts. */
export default async function ExplorarPage() {
  const { userId } = await auth();
  const [
    { exploreItems, myItems, collaborationItems, collaboratorItems },
    communityPosts,
  ] = await Promise.all([
    getProjectSocialCollections(userId),
    getCommunityPostsFeed(userId),
  ]);

  return (
    <>
      <ProjectsSocialView
        exploreItems={exploreItems}
        myItems={myItems}
        collaborationItems={collaborationItems}
        collaboratorItems={collaboratorItems}
        communityPosts={communityPosts}
      />
      <Footer />
    </>
  );
}
