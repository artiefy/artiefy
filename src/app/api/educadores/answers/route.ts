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
        { success: false, message: "Se requiere activityId" },
        { status: 400 },
      );
    }

    const keys = await redis.keys(`answer:${activityId}:*`);
    const answers = await Promise.all(keys.map((key) => redis.get(key)));

    return NextResponse.json({ success: true, answers });
  } catch (error) {
    console.error("Error fetching student answers:", error);
    return NextResponse.json(
      { success: false, message: "Error en el servidor" },
      { status: 500 },
    );
  }
}
