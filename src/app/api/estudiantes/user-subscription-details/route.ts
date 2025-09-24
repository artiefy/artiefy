import { NextResponse } from 'next/server';

import { getUserSubscriptionDetails } from '~/server/actions/estudiantes/subscriptions/getUserSubscriptionDetails';

export async function GET() {
  const details = await getUserSubscriptionDetails();
  if (!details) {
    return NextResponse.json(
      { error: 'No subscription data found' },
      { status: 404 }
    );
  }
  return NextResponse.json(details);
}
