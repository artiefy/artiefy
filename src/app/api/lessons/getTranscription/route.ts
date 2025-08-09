import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId parameter' },
        { status: 400 }
      );
    }

    // Check lesson exists in DB
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, parseInt(lessonId)),
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Fetch transcription from Redis
    const transcriptionKey = `transcription:lesson:${lessonId}`;
    const transcription = await redis.get(transcriptionKey);

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Error fetching transcription:', error);
    return NextResponse.json(
      { error: 'Error retrieving transcription' },
      { status: 500 }
    );
  }
}
