import { NextResponse } from "next/server";

import { count, eq } from "drizzle-orm";

import { db } from "~/server/db/index";
import {
  enrollments,
  lessons,
  userLessonsProgress,
  users,
  userTimeTracking,
} from "~/server/db/schema";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Falta el parámetro courseId" },
        { status: 400 },
      );
    }

    // 🔍 Obtener estudiantes inscritos en el curso
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        lastLogin: users.updatedAt,
        completedCourses: enrollments.completed,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(eq(enrollments.courseId, parseInt(courseId, 10)))
      .execute();

    const today = new Date().toISOString().split("T")[0];

    // 🔍 Obtener progreso de cada estudiante
    const studentProgress = await Promise.all(
      students.map(async (student) => {
        const totalLessons = await db
          .select({ total: count() })
          .from(lessons)
          .where(eq(lessons.courseId, parseInt(courseId, 10)))
          .then((res) => res[0]?.total || 1);

        const completedLessons = await db
          .select({ completed: count() })
          .from(userLessonsProgress)
          .where(eq(userLessonsProgress.userId, student.id))
          .then((res) => res[0]?.completed || 0);

        const progressPercentage = Math.round(
          (completedLessons / totalLessons) * 100,
        );

        return { ...student, progress: progressPercentage };
      }),
    );

    // Recuperar el tiempo de conexión para cada estudiante
    const studentTimeData = await db
      .select({
        userId: userTimeTracking.userId,
        timeSpent: userTimeTracking.timeSpent,
      })
      .from(userTimeTracking)
      .where(eq(userTimeTracking.date, today))
      .execute();

    // Crear un mapa con el tiempo de conexión de cada estudiante
    const timeTrackingMap: Record<string, number> = {};
    studentTimeData.forEach((record) => {
      timeTrackingMap[record.userId] = record.timeSpent;
    });

    // Agregar el tiempo de conexión a cada estudiante
    const studentsWithTime = studentProgress.map((student) => ({
      ...student,
      timeSpent: timeTrackingMap[student.id] ?? 0, // Asigna 0 si no hay tiempo registrado
    }));

    return NextResponse.json({ students: studentsWithTime });
  } catch (error) {
    console.error("❌ Error al obtener los datos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
