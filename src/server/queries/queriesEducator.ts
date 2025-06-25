'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  activities,
  enrollments,
  parametros,
  userActivitiesProgress,
  userLessonsProgress,
} from '~/server/db/schema';

export async function getUsersEnrolledInCourse(courseId: number) {
  const client = await clerkClient();
  const usersResponse = await client.users.getUserList({ limit: 500 });
  const users = usersResponse.data;

  console.log('▶️  getUsersEnrolledInCourse – curso:', courseId);

  const enrolledUsers = await db
    .select({
      userId: enrollments.userId,
      courseId: enrollments.courseId,
      enrolledAt: enrollments.enrolledAt,
    })
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId));

  console.log('🔢  inscritos en BD:', enrolledUsers.length);

  const userIds = enrolledUsers.map((e) => e.userId);
  const filteredUsers = users.filter((user) => userIds.includes(user.id));

  const simplifiedUsers = await Promise.all(
    filteredUsers.map(async (user) => {
      const enrollment = enrolledUsers.find((e) => e.userId === user.id);

      // ① progreso de lecciones
      const lessonsProgress = await db
        .select({
          lessonId: userLessonsProgress.lessonId,
          progress: userLessonsProgress.progress,
          isCompleted: userLessonsProgress.isCompleted,
        })
        .from(userLessonsProgress)
        .where(eq(userLessonsProgress.userId, user.id));

      // ② notas por parámetro
      const parametroAverages = await db
        .select({
          parametroId: parametros.id,
          parametroName: parametros.name,
          avgGrade: sql<number>`AVG(${userActivitiesProgress.finalGrade})`.as(
            'grade'
          ),
        })
        .from(userActivitiesProgress)
        .innerJoin(
          activities,
          eq(userActivitiesProgress.activityId, activities.id)
        )
        .innerJoin(parametros, eq(activities.parametroId, parametros.id))
        .where(
          and(
            eq(userActivitiesProgress.userId, user.id),
            eq(parametros.courseId, courseId)
          )
        )
        .groupBy(parametros.id, parametros.name);

      let parameterGrades =
        parametroAverages.length > 0
          ? parametroAverages.map((p) => ({
              parametroId: p.parametroId,
              parametroName: p.parametroName,
              grade: parseFloat(p.avgGrade.toFixed(2)),
            }))
          : [];

      if (parameterGrades.length === 0) {
        const fallbackParametros = await db
          .select({
            parametroId: parametros.id,
            parametroName: parametros.name,
          })
          .from(parametros)
          .where(eq(parametros.courseId, courseId));

        parameterGrades = fallbackParametros.map((p) => ({
          parametroId: p.parametroId,
          parametroName: p.parametroName,
          grade: 0,
        }));
      }

      const actividadNotas = await db
        .select({
          activityId: activities.id,
          activityName: activities.name,
          parametroId: parametros.id,
          parametroName: parametros.name,
          grade: userActivitiesProgress.finalGrade,
        })
        .from(userActivitiesProgress)
        .innerJoin(
          activities,
          eq(userActivitiesProgress.activityId, activities.id)
        )
        .innerJoin(parametros, eq(activities.parametroId, parametros.id))
        .where(
          and(
            eq(userActivitiesProgress.userId, user.id),
            eq(parametros.courseId, courseId)
          )
        );

      console.log(
        `✅  usuario procesado: ${user.id}  |  parametros-con-nota: ${parametroAverages.length}`
      );

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses.find(
          (email) => email.id === user.primaryEmailAddressId
        )?.emailAddress,
        createdAt: user.createdAt,
        enrolledAt: enrollment?.enrolledAt ?? null,
        role: user.publicMetadata.role ?? 'estudiante',
        status: user.publicMetadata.status ?? 'activo',
        lastConnection: user.lastActiveAt,
        lessonsProgress: lessonsProgress.map((l) => ({
          lessonId: l.lessonId,
          progress: l.progress,
          isCompleted: l.isCompleted,
        })),
        parameterGrades,
        activitiesWithGrades: actividadNotas.map((a) => ({
          activityId: a.activityId,
          activityName: a.activityName,
          parametroId: a.parametroId,
          parametroName: a.parametroName,
          grade: a.grade ?? 0,
        })),
      };
    })
  );

  console.log('🏁  total enviados al front:', simplifiedUsers.length);
  return simplifiedUsers;
}
