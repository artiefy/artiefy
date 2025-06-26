// /api/enrollments/markIncomplete/route.ts

import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { enrollments } from '~/server/db/schema';

export async function PATCH(req: Request) {
  try {
    const { userIds, courseId } = await req.json();

    if (!Array.isArray(userIds) || typeof courseId !== 'number') {
      return new Response('Invalid input', { status: 400 });
    }

    await Promise.all(
      userIds.map((userId) =>
        db
          .update(enrollments)
          .set({ completed: false })
          .where(
            and(
              eq(enrollments.userId, userId as string),
              eq(enrollments.courseId, courseId)
            )
          )
      )
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('[markIncomplete] Error:', err);
    return new Response('Error updating users', { status: 500 });
  }
}
