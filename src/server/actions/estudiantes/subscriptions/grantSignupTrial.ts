import { clerkClient } from '@clerk/nextjs/server';
import { formatInTimeZone } from 'date-fns-tz';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { users } from '~/server/db/schema';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TIME_ZONE = 'America/Bogota';

/** Free Premium days granted once, when the account is created. */
export const SIGNUP_TRIAL_DAYS = 10;

const TRIAL_PLAN_TYPE = 'Premium';

interface GrantSignupTrialInput {
  clerkUserId: string;
  email: string;
  name?: string | null;
}

type GrantSkipReason =
  'already-had-subscription' | 'already-purchased' | 'missing-email';

interface GrantSignupTrialResult {
  granted: boolean;
  reason?: GrantSkipReason;
  subscriptionEndDate?: string;
}

/**
 * Grants the one-time signup trial: `SIGNUP_TRIAL_DAYS` of Premium, written to
 * both the database and the Clerk `publicMetadata` (the front end gates on the
 * metadata, the daily cron reads the database).
 *
 * Expiry is NOT handled here. The existing `/api/cron/check-subscriptions` job
 * already deactivates any user whose `subscriptionEndDate` has passed, so the
 * trial switches itself off with no extra scheduling.
 *
 * Safe to call more than once: a user who already has a subscription end date
 * or a recorded purchase is skipped, so the trial can never be granted twice.
 */
export async function grantSignupTrial({
  clerkUserId,
  email,
  name,
}: GrantSignupTrialInput): Promise<GrantSignupTrialResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { granted: false, reason: 'missing-email' };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, clerkUserId),
  });

  // A recorded purchase means this is not a fresh account.
  if (existingUser?.purchaseDate) {
    return { granted: false, reason: 'already-purchased' };
  }

  // A subscription end date means the trial (or a plan) was already applied.
  if (existingUser?.subscriptionEndDate) {
    return { granted: false, reason: 'already-had-subscription' };
  }

  const now = new Date();
  const subscriptionEndDate = new Date(
    now.getTime() + SIGNUP_TRIAL_DAYS * DAY_IN_MS
  );
  const formattedEndDate = formatInTimeZone(
    subscriptionEndDate,
    TIME_ZONE,
    'yyyy-MM-dd HH:mm:ss'
  );

  if (existingUser) {
    await db
      .update(users)
      .set({
        planType: TRIAL_PLAN_TYPE,
        subscriptionStatus: 'active',
        subscriptionEndDate,
        updatedAt: now,
      })
      .where(eq(users.id, clerkUserId));
  } else {
    await db.insert(users).values({
      id: clerkUserId,
      email: normalizedEmail,
      name: name?.trim() ?? normalizedEmail.split('@')[0],
      role: 'estudiante',
      planType: TRIAL_PLAN_TYPE,
      subscriptionStatus: 'active',
      subscriptionEndDate,
      createdAt: now,
      updatedAt: now,
    });
  }

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(clerkUserId);

  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      ...clerkUser.publicMetadata,
      role: clerkUser.publicMetadata?.role ?? 'estudiante',
      planType: TRIAL_PLAN_TYPE,
      subscriptionStatus: 'active',
      subscriptionEndDate: formattedEndDate,
      // Marks the plan as the free signup trial rather than a paid plan, so
      // the UI and reports can tell them apart.
      isTrial: true,
    },
  });

  return { granted: true, subscriptionEndDate: formattedEndDate };
}
