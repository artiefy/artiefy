import { clerkClient } from '@clerk/nextjs/server';
import { count, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projects, users } from '~/server/db/schema';

import 'server-only';

/** Projects the free signup trial may create in total. */
export const TRIAL_PROJECT_LIMIT = 1;

const STAFF_ROLES = new Set(['admin', 'super-admin', 'educador']);

export type ProjectCreationDenial =
  'no-subscription' | 'expired' | 'trial-limit';

export type ProjectCreationAccess =
  | { allowed: true }
  | { allowed: false; reason: ProjectCreationDenial; message: string };

const DENIAL_MESSAGES: Record<ProjectCreationDenial, string> = {
  'no-subscription': 'Necesitas una suscripción activa para crear proyectos.',
  expired: 'Tu suscripción expiró. Renuévala para crear nuevos proyectos.',
  'trial-limit': `Tu prueba gratis incluye ${TRIAL_PROJECT_LIMIT} proyecto. Elige un plan para crear más.`,
};

const deny = (reason: ProjectCreationDenial): ProjectCreationAccess => ({
  allowed: false,
  reason,
  message: DENIAL_MESSAGES[reason],
});

/**
 * Whether this user may create a NEW project. Editing existing ones is never
 * gated here.
 *
 * - Staff roles are never blocked.
 * - Students need an active plan whose end date has not passed. The 5-day
 *   renewal window after expiry (see `checkSubscriptionStatus`) does NOT
 *   count: it only keeps the banner nagging.
 * - The signup trial (`isTrial` in Clerk metadata, see `grantSignupTrial`)
 *   is capped at `TRIAL_PROJECT_LIMIT` projects. A recorded purchase always
 *   wins over a stale `isTrial` flag, so a trial user who paid is not capped.
 *
 * Clerk metadata is what the rest of the app gates on; the database only adds
 * the purchase record and the project count.
 */
export async function getProjectCreationAccess(
  userId: string
): Promise<ProjectCreationAccess> {
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const metadata = clerkUser.publicMetadata ?? {};

  if (typeof metadata.role === 'string' && STAFF_ROLES.has(metadata.role)) {
    return { allowed: true };
  }

  const status =
    typeof metadata.subscriptionStatus === 'string'
      ? metadata.subscriptionStatus
      : '';
  const endDateValue =
    typeof metadata.subscriptionEndDate === 'string'
      ? metadata.subscriptionEndDate
      : '';

  if (!status && !endDateValue) return deny('no-subscription');
  if (status !== 'active') return deny('expired');

  if (endDateValue) {
    // Stored both as ISO and as "yyyy-MM-dd HH:mm:ss" in Bogotá time (see
    // `grantSignupTrial`); the latter carries no offset, so add Bogotá's.
    const endDate = new Date(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(endDateValue)
        ? `${endDateValue.replace(' ', 'T')}-05:00`
        : endDateValue
    );
    if (!Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) {
      return deny('expired');
    }
  }

  if (metadata.isTrial === true) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { purchaseDate: true },
    });

    if (!dbUser?.purchaseDate) {
      const [row] = await db
        .select({ total: count() })
        .from(projects)
        .where(eq(projects.userId, userId));
      if ((row?.total ?? 0) >= TRIAL_PROJECT_LIMIT) {
        return deny('trial-limit');
      }
    }
  }

  return { allowed: true };
}
