import { type NextRequest, NextResponse } from "next/server";

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");
    if (!activityId) {
      return NextResponse.json(
        { error: "Missing activityId" },
        { status: 400 },
      );
    }
    const key = `activity:${activityId}:questionsFilesSubida`;
    const data = await redis.get(key);
    // Espera un array de objetos
    return NextResponse.json(data ?? []);
  } catch (_error) {
    return NextResponse.json(
      { error: "Error fetching help file" },
      { status: 500 },
    );
  }
}
