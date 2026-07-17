import 'server-only';

const GUIDED_PROJECT_PLANS = new Set(['enterprise', 'premium', 'pro']);

interface ClerkSubscriptionUser {
  publicMetadata?: unknown;
}

interface SubscriptionMetadata {
  planType?: unknown;
  subscriptionEndDate?: unknown;
  subscriptionStatus?: unknown;
}

function getSubscriptionMetadata(value: unknown): SubscriptionMetadata {
  return value && typeof value === 'object'
    ? (value as SubscriptionMetadata)
    : {};
}

export function hasActiveGuidedProjectEntitlement(
  user: ClerkSubscriptionUser,
  now = new Date()
): boolean {
  const metadata = getSubscriptionMetadata(user.publicMetadata);
  const planType =
    typeof metadata.planType === 'string'
      ? metadata.planType.trim().toLowerCase()
      : '';
  const subscriptionStatus =
    typeof metadata.subscriptionStatus === 'string'
      ? metadata.subscriptionStatus.trim().toLowerCase()
      : '';

  if (subscriptionStatus !== 'active' || !GUIDED_PROJECT_PLANS.has(planType)) {
    return false;
  }

  if (
    metadata.subscriptionEndDate === null ||
    metadata.subscriptionEndDate === undefined ||
    metadata.subscriptionEndDate === ''
  ) {
    return true;
  }

  const endDate =
    metadata.subscriptionEndDate instanceof Date
      ? new Date(metadata.subscriptionEndDate.getTime())
      : typeof metadata.subscriptionEndDate === 'string'
        ? new Date(metadata.subscriptionEndDate)
        : null;
  const endTimestamp = endDate?.getTime() ?? Number.NaN;
  const nowTimestamp = now.getTime();

  return (
    Number.isFinite(endTimestamp) &&
    Number.isFinite(nowTimestamp) &&
    endTimestamp > nowTimestamp
  );
}
