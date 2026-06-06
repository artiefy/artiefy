import { NextResponse } from 'next/server';

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';

import { getUserRole, STUDENT_ROLE } from '~/utils/roles';

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  const currentRole = getUserRole(user?.publicMetadata?.role);

  if (currentRole) {
    return NextResponse.json({ role: currentRole, updated: false });
  }

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...(user?.publicMetadata ?? {}),
      role: STUDENT_ROLE,
    },
  });

  return NextResponse.json({ role: STUDENT_ROLE, updated: true });
}
