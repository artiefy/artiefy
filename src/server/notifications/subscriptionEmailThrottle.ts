import { Redis } from '@upstash/redis';

/**
 * Authoritative once-a-day guard for subscription notification emails.
 *
 * The subscription banner re-runs its status check on every client navigation,
 * so without a shared claim each route change queued another email. Redis keeps
 * the claim across devices, tabs and serverless instances; the browser-side
 * check in `checkSubscriptionStatus` only avoids the extra round trip.
 */

/** Daily buckets follow Colombia time, the platform's reference timezone. */
const NOTIFICATION_TIMEZONE = 'America/Bogota';

/** Two days is enough to outlive the calendar day the key belongs to. */
const TTL_SECONDS = 60 * 60 * 48;

const redis = Redis.fromEnv();

function currentDayKey(): string {
  // `en-CA` formats as YYYY-MM-DD, which sorts and reads well as a key.
  return new Date().toLocaleDateString('en-CA', {
    timeZone: NOTIFICATION_TIMEZONE,
  });
}

function buildKey(recipient: string): string {
  return `subscription-email:${recipient.trim().toLowerCase()}:${currentDayKey()}`;
}

/**
 * Reserves today's slot for a recipient. Returns `true` only for the first
 * caller of the day, so concurrent requests can race safely.
 */
export async function claimDailySubscriptionEmail(
  recipient: string
): Promise<boolean> {
  try {
    const claimed = await redis.set(buildKey(recipient), '1', {
      nx: true,
      ex: TTL_SECONDS,
    });
    return claimed === 'OK';
  } catch (error) {
    // Fail open: a rare duplicate beats silently dropping the only warning a
    // student gets before losing access to the platform.
    console.error('Could not claim the daily subscription email slot:', error);
    return true;
  }
}

/**
 * Gives the slot back when the message could not be delivered, so a transient
 * SMTP failure does not consume the whole day's allowance.
 */
export async function releaseDailySubscriptionEmail(
  recipient: string
): Promise<void> {
  try {
    await redis.del(buildKey(recipient));
  } catch (error) {
    console.error(
      'Could not release the daily subscription email slot:',
      error
    );
  }
}
