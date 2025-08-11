import { type NextRequest, NextResponse } from "next/server";

import { Redis } from "@upstash/redis";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { userActivitiesProgress } from "~/server/db/schema";

export const dynamic = "force-dynamic";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");
    const userId = searchParams.get("userId");

    if (!activityId || !userId) {
      return NextResponse.json(
        { error: "ActivityId and userId are required" },
        { status: 400 },
      );
    }

    // Get attempts from database
    const progress = await db.query.userActivitiesProgress.findFirst({
      where: and(
        eq(userActivitiesProgress.userId, userId),
        eq(userActivitiesProgress.activityId, parseInt(activityId)),
      ),
    });

    // Get attempts from Redis
    const attemptsKey = `activity:${activityId}:user:${userId}:attempts`;
    const redisAttempts = (await redis.get<number>(attemptsKey)) ?? 0;

    // Use the higher value between Redis and database
    const attempts = Math.max(progress?.attemptCount ?? 0, redisAttempts);

    // Get activity details to check if it's revisada
    const activityKey = `activity:${activityId}`;
    const activity = await redis.get<{ revisada: boolean }>(activityKey);

    return NextResponse.json({
      attempts,
      attemptsLeft: activity?.revisada ? Math.max(0, 3 - attempts) : null,
      isRevisada: activity?.revisada ?? false,
      lastGrade: progress?.finalGrade ?? null,
      lastAttemptAt: progress?.lastAttemptAt ?? null,
    });
  } catch (error) {
    console.error("Error fetching attempts:", error);
    return NextResponse.json(
      { error: "Error fetching attempts" },
      { status: 500 },
    );
  }
}
