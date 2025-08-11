"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";

import { db } from "~/server/db";
import {
  activities,
  enrollments,
  parametros,
  userActivitiesProgress,
  userLessonsProgress,
} from "~/server/db/schema";

export async function getUsersEnrolledInCourse(courseId: number) {
  const client = await clerkClient();
  const usersResponse = await client.users.getUserList({ limit: 500 });
  const users = usersResponse.data;

  console.log("▶️ getUsersEnrolledInCourse – curso:", courseId);

  const enrolledUsers = await db
    .select({
      userId: enrollments.userId,
      courseId: enrollments.courseId,
      enrolledAt: enrollments.enrolledAt,
      completed: enrollments.completed,
    })
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId));

  console.log("🔢 inscritos en BD:", enrolledUsers.length);

  // Traer todos los parámetros del curso
  const allParametros = await db
    .select({
      parametroId: parametros.id,
      parametroName: parametros.name,
      parametroPeso: parametros.porcentaje,
    })
    .from(parametros)
    .where(eq(parametros.courseId, courseId));

  const simplifiedUsers = await Promise.all(
    enrolledUsers.map(async (enrollment) => {
      const userId = enrollment.userId;
      const clerkUser = users.find((u) => u.id === userId);

      if (!clerkUser) {
        console.warn(`⚠️ Usuario ${userId} no existe en Clerk`);
      }

      // progreso de lecciones
      const lessonsProgress = await db
        .select({
          lessonId: userLessonsProgress.lessonId,
          progress: userLessonsProgress.progress,
          isCompleted: userLessonsProgress.isCompleted,
        })
        .from(userLessonsProgress)
        .where(eq(userLessonsProgress.userId, userId));

      // Obtener promedios por parámetro SOLO si tiene actividades
      const parametroGrades = await db
        .select({
          parametroId: parametros.id,
          parametroName: parametros.name,
          parametroPeso: parametros.porcentaje,
          avgGrade: sql<number>`AVG(${userActivitiesProgress.finalGrade})`.as(
            "grade",
          ),
        })
        .from(userActivitiesProgress)
        .innerJoin(
          activities,
          eq(userActivitiesProgress.activityId, activities.id),
        )
        .innerJoin(parametros, eq(activities.parametroId, parametros.id))
        .where(
          and(
            eq(userActivitiesProgress.userId, userId),
            eq(parametros.courseId, courseId),
          ),
        )
        .groupBy(parametros.id, parametros.name, parametros.porcentaje);

      // Fusionar todos los parámetros del curso con los que tienen promedio para que siempre salgan
      const parameterGrades = allParametros.map((p) => {
        const found = parametroGrades.find(
          (pg) => pg.parametroId === p.parametroId,
        );
        return {
          parametroId: p.parametroId,
          parametroName: p.parametroName,
          parametroPeso: p.parametroPeso,
          grade: found ? parseFloat(found.avgGrade.toFixed(2)) : 0,
        };
      });

      // actividades con pesos completos
      let actividadNotas = await db
        .select({
          activityId: activities.id,
          activityName: activities.name,
          parametroId: parametros.id,
          parametroName: parametros.name,
          parametroPeso: parametros.porcentaje,
          actividadPeso: activities.porcentaje,
          grade: userActivitiesProgress.finalGrade,
        })
        .from(activities)
        .innerJoin(parametros, eq(activities.parametroId, parametros.id))
        .leftJoin(
          userActivitiesProgress,
          and(
            eq(userActivitiesProgress.activityId, activities.id),
            eq(userActivitiesProgress.userId, userId),
          ),
        )
        .where(eq(parametros.courseId, courseId));

      // Si no tiene actividades, construir una lista falsa con cada parámetro
      if (actividadNotas.length === 0) {
        actividadNotas = allParametros.map((p) => ({
          activityId: -1,
          activityName: "Sin actividad",
          parametroId: p.parametroId,
          parametroName: p.parametroName,
          parametroPeso: p.parametroPeso,
          actividadPeso: 0,
          grade: 0,
        }));
      }

      return {
        id: userId,
        firstName: clerkUser?.firstName ?? "",
        lastName: clerkUser?.lastName ?? "",
        email:
          clerkUser?.emailAddresses.find(
            (email) => email.id === clerkUser?.primaryEmailAddressId,
          )?.emailAddress ?? "",
        createdAt: clerkUser?.createdAt ?? null,
        enrolledAt: enrollment.enrolledAt ?? null,
        role: clerkUser?.publicMetadata.role ?? "estudiante",
        status: clerkUser?.publicMetadata.status ?? "activo",
        lastConnection: clerkUser?.lastActiveAt ?? null,
        lessonsProgress: lessonsProgress.map((l) => ({
          lessonId: l.lessonId,
          progress: l.progress,
          isCompleted: l.isCompleted,
        })),
        parameterGrades,
        completed: enrollment.completed ?? false,
        activitiesWithGrades: actividadNotas.map((a) => ({
          activityId: a.activityId,
          activityName: a.activityName,
          parametroId: a.parametroId,
          parametroName: a.parametroName,
          parametroPeso: a.parametroPeso,
          actividadPeso: a.actividadPeso,
          grade: a.grade ?? 0,
        })),
      };
    }),
  );

  simplifiedUsers.forEach((user) => {
    console.log(`📝 Usuario ${user.id}`);
    console.log("  parameterGrades:", user.parameterGrades);
    console.log("  activitiesWithGrades:", user.activitiesWithGrades);
  });

  console.log("🏁 total enviados al front:", simplifiedUsers.length);
  return simplifiedUsers;
}
