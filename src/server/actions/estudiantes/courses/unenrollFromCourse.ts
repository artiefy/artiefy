"use server";

import { currentUser } from "@clerk/nextjs/server";
import { and, eq, gt, or } from "drizzle-orm";

import { createNotification } from "~/server/actions/estudiantes/notifications/createNotification";
import { db } from "~/server/db";
import { courses, enrollments, userLessonsProgress } from "~/server/db/schema";

export async function unenrollFromCourse(
  courseId: number,
): Promise<{ success: boolean; message: string }> {
  const user = await currentUser();

  if (!user?.id) {
    return {
      success: false,
      message: "Usuario no autenticado",
    };
  }

  const userId = user.id;

  try {
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId),
      ),
    });

    if (!existingEnrollment) {
      return {
        success: false,
        message: "No estás inscrito en este curso",
      };
    }

    await db
      .delete(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      );

    // Actualizar el progreso de las lecciones del curso
    await db
      .update(userLessonsProgress)
      .set({ isNew: false })
      .where(
        and(
          eq(userLessonsProgress.userId, userId),
          or(
            eq(userLessonsProgress.progress, 0),
            gt(userLessonsProgress.progress, 1),
          ),
        ),
      );

    // Crear notificación de desuscripción
    try {
      // Obtener el título del curso para la notificación
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
      });

      await createNotification({
        userId,
        type: "COURSE_UNENROLLMENT",
        title: "Te has desuscrito del curso",
        message: `Te has desuscrito del curso ${course?.title ?? ""}`,
        metadata: { courseId },
      });
    } catch (error) {
      console.error("Error creando notificación de desuscripción:", error);
      // Continuar aunque falle la notificación
    }

    return {
      success: true,
      message: "Desinscripción exitosa",
    };
  } catch (error) {
    console.error("Error al desuscribirse del curso:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error desconocido al desuscribirse del curso",
    };
  }
}
