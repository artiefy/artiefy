import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { GuidedProjectsList } from '~/components/super-admin/layout/GuidedProjectsList';

export default async function GuidedProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/auth');

  return <GuidedProjectsList />;
}
