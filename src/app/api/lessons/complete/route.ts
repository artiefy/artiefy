import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';

import { db } from '~/server/db';
import { userLessonsProgress } from '~/server/db/schema';

export async function PATCH(request: Request) {
  try {
    const user = await currentUser();
    if (!user?.id)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );

    const { lessonId } = (await request.json()) as { lessonId?: number };
    if (!lessonId || typeof lessonId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid lessonId' },
        { status: 400 }
      );
    }

    await db
      .insert(userLessonsProgress)
      .values({
        userId: user.id,
        lessonId,
        progress: 100,
        isCompleted: true,
        isLocked: false,
        isNew: false,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
        set: {
          progress: 100,
          isCompleted: true,
          isLocked: false,
          isNew: false,
          lastUpdated: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error marking lesson complete:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
