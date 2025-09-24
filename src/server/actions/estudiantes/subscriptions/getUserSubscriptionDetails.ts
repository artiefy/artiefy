import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export async function getUserSubscriptionDetails() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return null;
  return {
    planType: user.planType,
    purchaseDate: user.purchaseDate,
    subscriptionEndDate: user.subscriptionEndDate,
  };
}
