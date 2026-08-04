import { type NextRequest } from 'next/server';

import { verifyWebhook } from '@clerk/nextjs/webhooks';

import { env } from '~/env';
import { grantSignupTrial } from '~/server/actions/estudiantes/subscriptions/grantSignupTrial';

/**
 * Clerk webhook receiver. Handles `user.created` to grant the signup trial.
 *
 * Configure it in the Clerk dashboard (Webhooks → Add endpoint) pointing to
 * `https://artiefy.com/api/webhooks/clerk` with the `user.created` event, and
 * copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.
 */
export async function POST(request: NextRequest) {
  if (!env.CLERK_WEBHOOK_SIGNING_SECRET) {
    console.error('❌ CLERK_WEBHOOK_SIGNING_SECRET is not configured');
    return Response.json(
      { error: 'Webhook signing secret not configured' },
      { status: 500 }
    );
  }

  let event;
  try {
    event = await verifyWebhook(request, {
      signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET,
    });
  } catch (error) {
    console.error('❌ Clerk webhook verification failed:', error);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'user.created') {
    return Response.json({ received: true, handled: false });
  }

  const {
    id,
    email_addresses,
    primary_email_address_id,
    first_name,
    last_name,
  } = event.data;

  const primaryEmail =
    email_addresses.find(
      (address) => address.id === primary_email_address_id
    ) ?? email_addresses[0];

  if (!primaryEmail?.email_address) {
    console.warn(`⚠️ Clerk user ${id} created without an email address`);
    return Response.json({ received: true, handled: false });
  }

  try {
    const result = await grantSignupTrial({
      clerkUserId: id,
      email: primaryEmail.email_address,
      name: [first_name, last_name].filter(Boolean).join(' ') || null,
    });

    console.log('🎁 Signup trial:', {
      user: primaryEmail.email_address,
      granted: result.granted,
      reason: result.reason,
      subscriptionEndDate: result.subscriptionEndDate,
    });

    return Response.json({ received: true, handled: true, ...result });
  } catch (error) {
    console.error('❌ Failed to grant signup trial:', error);
    // Returning 500 makes Clerk retry the delivery.
    return Response.json(
      { error: 'Failed to grant signup trial' },
      { status: 500 }
    );
  }
}
