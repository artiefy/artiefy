import { type NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { lessons, userLessonsProgress } from "~/server/db/schema";

interface NextLessonStatusResponse {
  lessonId: number | null;
  isUnlocked: boolean;
  error?: string;
}

export async function GET(
  _: NextRequest, // Rename 'request' to '_' to indicate it's intentionally unused
  { params }: { params: { id: string } },
): Promise<NextResponse<NextLessonStatusResponse>> {
  try {
    // Usar el patrón recomendado por Next.js para params asíncronos
    const paramsData = await Promise.resolve(params);
    const { id } = paramsData;

    if (!id) {
      return NextResponse.json({
        lessonId: null,
        isUnlocked: false,
        error: "ID no proporcionado",
      });
    }

    const currentLessonId = Number(id);
    if (isNaN(currentLessonId)) {
      return NextResponse.json({
        lessonId: null,
        isUnlocked: false,
        error: "ID inválido",
      });
    }

    // Get current lesson with activities
    const currentLesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, currentLessonId),
      with: {
        activities: true,
      },
    });

    if (!currentLesson) {
      return NextResponse.json({ lessonId: null, isUnlocked: false });
    }

    // Get next lesson with progress
    const nextLesson = await db.query.lessons.findFirst({
      where: eq(lessons.courseId, currentLesson.courseId),
      orderBy: (lessons, { asc }) => [asc(lessons.id)],
    });

    if (!nextLesson) {
      return NextResponse.json({ lessonId: null, isUnlocked: false });
    }

    // Get lesson progress
    const progress = await db.query.userLessonsProgress.findFirst({
      where: eq(userLessonsProgress.lessonId, nextLesson.id),
    });

    return NextResponse.json({
      lessonId: nextLesson.id,
      isUnlocked: progress?.isLocked === false,
    });
  } catch (error) {
    console.error("Error in next-lesson-status:", error);
    return NextResponse.json({
      lessonId: null,
      isUnlocked: false,
      error: "Error interno del servidor",
    });
  }
}
