import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { GuidedProjectsList } from '~/components/super-admin/layout/GuidedProjectsList';

export default async function GuidedProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/auth');

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#01142B] to-[#1d283a] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <GuidedProjectsList />
      </div>
    </div>
  );
}
