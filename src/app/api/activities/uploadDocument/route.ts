import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { activityId, userId, fileKey, fileName, fileType } = await request.json();

    // Save document info to Upstash
    const documentKey = `activity:${activityId}:user:${userId}:document`;
    await redis.set(documentKey, {
      fileKey,
      fileName,
      fileType,
      uploadedAt: new Date().toISOString(),
      status: 'pending', // pending, reviewed
      grade: null
    });

    // Update activity progress in database
    await db
      .insert(userActivitiesProgress)
      .values({
        userId,
        activityId,
        progress: 100,
        isCompleted: false, // Will be set to true when educator reviews
        lastUpdated: new Date(),
        revisada: false,
        attemptCount: 1
      })
      .onConflictDoUpdate({
        target: [userActivitiesProgress.userId, userActivitiesProgress.activityId],
        set: {
          progress: 100,
          lastUpdated: new Date()
        }
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving document:', error);
    return NextResponse.json(
      { error: 'Error al guardar el documento' },
      { status: 500 }
    );
  }
}
