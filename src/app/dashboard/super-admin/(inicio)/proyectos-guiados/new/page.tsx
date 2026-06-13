import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

export default async function NewGuidedProjectPage() {
  const { userId } = await auth();
  if (!userId) redirect('/auth');

  // Redirect to the main proyectos-guiados page where the modal can be opened
  redirect('/dashboard/super-admin/proyectos-guiados');
}
