import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { GuidedProjectsList } from '~/components/super-admin/layout/GuidedProjectsList';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function GuidedProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/auth');

  return <GuidedProjectsList />;
}
