import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { createNotification } from '~/server/actions/estudiantes/notifications/createNotification';
import { db } from '~/server/db';
import { lessons,userLessonsProgress } from '~/server/db/schema';

// Update the schema to remove currentLessonId
const unlockRequestSchema = z.object({
  lessonId: z.number(),
  hasActivities: z.boolean(),
  allActivitiesCompleted: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requestBody = unlockRequestSchema.safeParse(await request.json());

    if (!requestBody.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { lessonId, hasActivities, allActivitiesCompleted } =
      requestBody.data;

    // If lessonId is -1, it means there are no more lessons to unlock
    if (lessonId === -1) {
      return NextResponse.json({
        success: true,
        message: 'No more lessons to unlock',
      });
    }

    // Check if the lesson should be unlocked based on activities
    const shouldUnlock = hasActivities ? allActivitiesCompleted : true;

    if (!shouldUnlock) {
      return NextResponse.json(
        { success: false, error: 'Activities not completed' },
        { status: 400 }
      );
    }

    // Proceed with unlocking
    await db
      .insert(userLessonsProgress)
      .values({
        userId: user.id,
        lessonId,
        progress: 0,
        isCompleted: false,
        isLocked: false,
        isNew: true,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
        set: {
          isLocked: false,
          isNew: true,
          lastUpdated: new Date(),
        },
      });

    // Get the lesson details for the notification
    const nextLesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      columns: {
        id: true,
        title: true,
        courseId: true,
      },
    });

    if (!nextLesson) {
      return NextResponse.json(
        { success: false, error: 'Next lesson not found' },
        { status: 404 }
      );
    }

    // Create notification for unlocked lesson
    await createNotification({
      userId: user.id,
      type: 'LESSON_UNLOCKED',
      title: '¡Nueva lección desbloqueada!',
      message: `Se ha desbloqueado la lección: ${nextLesson.title}`,
      metadata: {
        lessonId: nextLesson.id,
        courseId: nextLesson.courseId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lesson unlocked successfully',
    });
  } catch (error) {
    console.error(
      'Error unlocking lesson:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
