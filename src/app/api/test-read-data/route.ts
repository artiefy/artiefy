import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import {
  certificationTypes,
  scheduleOptions,
  spaceOptions,
} from '~/server/db/schema';

export async function GET() {
  // Security best practice: dev-only test endpoint; never reachable in prod.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const certs = await db.select().from(certificationTypes);
    const schedules = await db.select().from(scheduleOptions);
    const spaces = await db.select().from(spaceOptions);

    return NextResponse.json({
      certificationTypes: certs,
      scheduleOptions: schedules,
      spaceOptions: spaces,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
