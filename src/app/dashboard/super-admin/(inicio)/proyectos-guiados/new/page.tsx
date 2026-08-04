import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function NewGuidedProjectPage() {
  const { userId } = await auth();
  if (!userId) redirect('/auth');

  // Redirect to the main proyectos-guiados page where the modal can be opened
  redirect('/dashboard/super-admin/proyectos-guiados');
}
