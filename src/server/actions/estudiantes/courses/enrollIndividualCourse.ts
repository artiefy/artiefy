"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db } from "~/server/db";
import {
  enrollments,
  lessons,
  userLessonsProgress,
  users,
} from "~/server/db/schema";
import { sortLessons } from "~/utils/lessonSorting";

export async function enrollUserInCourse(userEmail: string, courseId: number) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  console.log("📝 Starting enrollment process:", {
    userEmail: normalizedEmail,
    courseId,
  });

  try {
    // Buscar usuario en la base de datos
    let user = await db.query.users.findFirst({
      where: and(
        eq(users.email, normalizedEmail),
        eq(users.role, "estudiante"),
      ),
    });

    // Si no existe el usuario, buscar en Clerk
    let userId: string | undefined = user?.id;
    if (!user) {
      // Buscar usuario en Clerk
      const clerk = await clerkClient();
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [normalizedEmail],
      });
      if (clerkUsers.totalCount > 0) {
        userId = clerkUsers.data[0].id;
      } else {
        userId = uuidv4();
      }

      try {
        await db.insert(users).values({
          id: userId,
          email: normalizedEmail,
          name: normalizedEmail.split("@")[0],
          role: "estudiante",
          subscriptionStatus: "inactive",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Verificar que el usuario se creó correctamente
        user = await db.query.users.findFirst({
          where: and(
            eq(users.email, normalizedEmail),
            eq(users.role, "estudiante"),
          ),
        });

        if (!user) {
          throw new Error("Error al crear el usuario en la base de datos");
        }

        console.log("✅ New user created:", { id: user.id, email: user.email });
      } catch (error) {
        console.error("❌ Error creating user:", error);
        throw new Error("Error al crear el usuario en la base de datos");
      }
    }

    console.log("✅ Found student user:", {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Verificar inscripción existente con el ID correcto
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, user.id),
        eq(enrollments.courseId, courseId),
      ),
    });

    if (existingEnrollment) {
      console.log("ℹ️ User already enrolled:", { userEmail, courseId });
      return { success: true, message: "Usuario ya inscrito" };
    }

    // Crear inscripción con el ID del usuario estudiante
    await db.insert(enrollments).values({
      userId: user.id,
      courseId: courseId,
      enrolledAt: new Date(),
      completed: false,
      isPermanent: true,
    });

    // Obtener lecciones
    const courseLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, courseId),
    });

    // Ordenar lecciones usando nuestra utilidad de ordenamiento compartida
    const sortedLessons = sortLessons(courseLessons);

    // Obtener IDs de lecciones en el orden correcto
    const lessonIds = sortedLessons.map((lesson) => lesson.id);

    // Obtener registros de progreso existentes para este usuario y estas lecciones específicas
    const existingProgress = await db.query.userLessonsProgress.findMany({
      where: and(
        eq(userLessonsProgress.userId, user.id),
        inArray(userLessonsProgress.lessonId, lessonIds),
      ),
    });

    // Crear un conjunto de progreso de lecciones existentes para una búsqueda más rápida
    const existingProgressSet = new Set(
      existingProgress.map((progress) => progress.lessonId),
    );

    // Insertar progreso solo para lecciones que no tienen progreso
    for (const [index, lesson] of sortedLessons.entries()) {
      if (!existingProgressSet.has(lesson.id)) {
        // Verificar si es la primera lección O tiene "Bienvenida" en el título
        const isFirstOrWelcome =
          index === 0 ||
          lesson.title.toLowerCase().includes("bienvenida") ||
          lesson.title.toLowerCase().includes("clase 1");

        await db.insert(userLessonsProgress).values({
          userId: user.id,
          lessonId: lesson.id,
          progress: 0,
          isCompleted: false,
          isLocked: !isFirstOrWelcome, // Desbloquear solo la primera lección o la lección de bienvenida
          isNew: true,
          lastUpdated: new Date(),
        });
      }
    }

    console.log("✅ Enrollment successful for student:", {
      userId: user.id,
      email: user.email,
      courseId,
    });

    return { success: true, message: "Inscripción exitosa" };
  } catch (error) {
    console.error("❌ Enrollment error:", error);
    throw error;
  }
}
