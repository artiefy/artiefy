import { type NextRequest } from 'next/server';

import { env } from '~/env';
import { checkProjectActivitiesDue } from '~/server/actions/estudiantes/projects/checkProjectActivitiesDue';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cronSecret = env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  console.log('Debug Auth:', {
    authHeaderReceived: authHeader,
    expectedAuth: `Bearer ${cronSecret}`,
    hasSecret: !!cronSecret,
    isDev: process.env.NODE_ENV === 'development',
  });

  if (!cronSecret) {
    return Response.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Invalid authorization' }, { status: 401 });
  }

  try {
    const result = await checkProjectActivitiesDue();
    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Cron job error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
