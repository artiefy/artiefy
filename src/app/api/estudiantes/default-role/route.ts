import { NextResponse } from 'next/server';

import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';

import { grantSignupTrial } from '~/server/actions/estudiantes/subscriptions/grantSignupTrial';
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

  // Safety net for the signup trial: the Clerk `user.created` webhook is the
  // primary path, but this runs for anyone who reaches the app without it
  // (webhook not configured yet, or a failed delivery). `grantSignupTrial` is
  // idempotent, so a user who already got it is skipped.
  const email = user?.primaryEmailAddress?.emailAddress;

  if (email) {
    try {
      await grantSignupTrial({
        clerkUserId: userId,
        email,
        name: user?.fullName ?? null,
      });
    } catch (error) {
      // Never block the role assignment because the trial failed.
      console.error('❌ Failed to grant signup trial:', error);
    }
  }

  return NextResponse.json({ role: STUDENT_ROLE, updated: true });
}
