import { Redis } from '@upstash/redis';

/**
 * Usage tiers for the agent chat (Artie / Tutor / Coach).
 *
 * - `anon`: visitor with no session. Lifetime allowance, tracked per browser.
 * - `free`: signed in without a paid plan — this covers the 10-day signup
 *   trial and any account whose plan is not active. Lifetime allowance.
 * - `premium`: signed in with an active paid plan. Allowance resets daily.
 */
export type AgentQuotaTier = 'anon' | 'free' | 'premium';

export const AGENT_QUOTA_LIMITS: Record<AgentQuotaTier, number> = {
  anon: 5,
  free: 10,
  premium: 50,
};

const TTL_SECONDS: Record<AgentQuotaTier, number> = {
  anon: 60 * 60 * 24 * 365,
  free: 60 * 60 * 24 * 365,
  // Two days is enough to outlive the calendar day the key belongs to.
  premium: 60 * 60 * 48,
};

/** Daily buckets follow Colombia time, the platform's reference timezone. */
const QUOTA_TIMEZONE = 'America/Bogota';

export interface AgentQuotaState {
  allowed: boolean;
  tier: AgentQuotaTier;
  limit: number;
  remaining: number;
  /** Premium resets every day; the other tiers do not. */
  resetsDaily: boolean;
}

export interface AgentQuotaConsumption extends AgentQuotaState {
  /** Redis key of the consumed counter, needed to refund it. */
  key: string;
}

const redis = Redis.fromEnv();

function currentDayKey(): string {
  // `en-CA` formats as YYYY-MM-DD, which sorts and reads well as a key.
  return new Date().toLocaleDateString('en-CA', { timeZone: QUOTA_TIMEZONE });
}

function buildKey(tier: AgentQuotaTier, identifier: string): string {
  return tier === 'premium'
    ? `agent-chat:premium:${identifier}:${currentDayKey()}`
    : `agent-chat:${tier}:${identifier}`;
}

/**
 * Maps Clerk public metadata to a quota tier. A paid, non-expired plan gets the
 * daily premium allowance; the signup trial and every inactive plan stay on the
 * free lifetime allowance.
 */
export function resolveAgentQuotaTier(
  publicMetadata: Readonly<Record<string, unknown>> | null | undefined
): Exclude<AgentQuotaTier, 'anon'> {
  if (!publicMetadata) return 'free';

  const metadata = publicMetadata;

  // The signup trial is stored as Premium, so it must be excluded explicitly.
  if (metadata.isTrial === true) return 'free';

  const planType =
    typeof metadata.planType === 'string' ? metadata.planType : '';
  if (planType !== 'Premium' && planType !== 'Pro') return 'free';

  if (metadata.subscriptionStatus !== 'active') return 'free';

  if (typeof metadata.subscriptionEndDate === 'string') {
    const endDate = new Date(metadata.subscriptionEndDate);
    if (!Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) {
      return 'free';
    }
  }

  return 'premium';
}

/**
 * Increments the tier counter and reports whether the request fits in the
 * allowance. An over-limit hit is rolled back so the counter never drifts past
 * the limit, keeping `remaining` meaningful on later reads.
 */
export async function consumeAgentQuota(
  tier: AgentQuotaTier,
  identifier: string
): Promise<AgentQuotaConsumption> {
  const limit = AGENT_QUOTA_LIMITS[tier];
  const key = buildKey(tier, identifier);
  const resetsDaily = tier === 'premium';

  const used = await redis.incr(key);
  if (used === 1) {
    await redis.expire(key, TTL_SECONDS[tier]);
  }

  if (used > limit) {
    await redis.decr(key);
    return { allowed: false, tier, limit, remaining: 0, resetsDaily, key };
  }

  return {
    allowed: true,
    tier,
    limit,
    remaining: limit - used,
    resetsDaily,
    key,
  };
}

/** Gives an attempt back when the agent could not be reached at all. */
export async function refundAgentQuota(key: string): Promise<void> {
  try {
    await redis.decr(key);
  } catch (error) {
    console.error('Could not refund agent chat quota:', error);
  }
}
