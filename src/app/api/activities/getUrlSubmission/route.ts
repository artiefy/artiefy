import { type NextRequest, NextResponse } from "next/server";

import { Redis } from "@upstash/redis";
import { and, eq } from "drizzle-orm";

import { createNotification } from "~/server/actions/estudiantes/notifications/createNotification";
import { db } from "~/server/db";
import { activities, userActivitiesProgress } from "~/server/db/schema";

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
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Get URL submission info from Redis
    const submissionKey = `activity:${activityId}:user:${userId}:urlsubmission`;
    const submission = await redis.get(submissionKey);

    // Get progress info from database
    const progress = await db.query.userActivitiesProgress.findFirst({
      where: and(
        eq(userActivitiesProgress.activityId, parseInt(activityId)),
        eq(userActivitiesProgress.userId, userId),
      ),
    });

    const response = {
      submission,
      progress,
    };

    // --- Notificación si grade pasa de 0 a >0 y status es reviewed ---
    if (
      submission &&
      typeof submission === "object" &&
      "grade" in submission &&
      typeof submission.grade === "number" &&
      "status" in submission &&
      submission.status === "reviewed"
    ) {
      // Obtener progreso de la base de datos
      const lastGrade = progress?.finalGrade ?? 0;
      if (submission.grade > 0 && lastGrade === 0) {
        // Obtener lessonId de la actividad
        let lessonId: number | undefined = undefined;
        const activityDb = await db.query.activities.findFirst({
          where: eq(activities.id, parseInt(activityId)),
        });
        if (activityDb?.lessonsId) {
          lessonId = activityDb.lessonsId;
        }
        await createNotification({
          userId,
          type: "ACTIVITY_COMPLETED",
          title: "¡Tu documento ha sido calificado!",
          message: `El educador ha calificado tu documento en la clase. Revisa tu calificación.`,
          metadata: {
            activityId: parseInt(activityId),
            lessonId,
            openModal: true,
          },
        });
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting URL submission:", error);
    return NextResponse.json(
      { error: "Error retrieving URL submission" },
      { status: 500 },
    );
  }
}
