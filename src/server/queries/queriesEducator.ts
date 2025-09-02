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

// Convierte a número de forma segura
function toNum(v: unknown, fallback = 0): number {
  const n =
    typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

// Redondea a 2 decimales sin usar toFixed (evita strings)
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---- Tipos seguros para el publicMetadata de Clerk ----
interface PublicMeta {
  role?: 'estudiante' | 'educador' | 'admin' | 'super-admin';
  status?: 'activo' | 'inactivo';
}

function parsePublicMeta(meta: unknown): PublicMeta {
  const out: PublicMeta = {};
  if (meta && typeof meta === 'object') {
    const m = meta as Record<string, unknown>;

    const role = m.role;
    if (
      role === 'estudiante' ||
      role === 'educador' ||
      role === 'admin' ||
      role === 'super-admin'
    ) {
      out.role = role;
    }

    const status = m.status;
    if (status === 'activo' || status === 'inactivo') {
      out.status = status;
    }
  }
  return out;
}

export async function getUsersEnrolledInCourse(courseId: number) {
  const client = await clerkClient();

  console.log('▶️ getUsersEnrolledInCourse – curso:', courseId);

  // 1) Inscritos en BD
  const enrolledUsers = await db
    .select({
      userId: enrollments.userId,
      courseId: enrollments.courseId,
      enrolledAt: enrollments.enrolledAt,
      completed: enrollments.completed,
    })
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId));

  console.log('🔢 inscritos en BD:', enrolledUsers.length);
  if (enrolledUsers.length === 0) return [];

  // 2) Traer SOLO los usuarios de Clerk que corresponden a los inscritos
  const enrolledIds = enrolledUsers.map((e) => e.userId);
  const usersResponse = await client.users.getUserList({
    userId: enrolledIds,
    limit: Math.max(enrolledIds.length, 1),
  });
  const users = usersResponse.data;
  const userById = new Map(users.map((u) => [u.id, u]));

  // 3) Traer parámetros del curso
  const allParametros = await db
    .select({
      parametroId: parametros.id,
      parametroName: parametros.name,
      parametroPeso: parametros.porcentaje,
    })
    .from(parametros)
    .where(eq(parametros.courseId, courseId));

  // 4) Construir respuesta SOLO para los que existen en Clerk
  const simplifiedUsers = (
    await Promise.all(
      enrolledUsers.map(async (enrollment) => {
        const userId = enrollment.userId;
        const clerkUser = userById.get(userId);

        // ❌ Si no existe en Clerk, NO lo mostramos
        if (!clerkUser) {
          console.warn(`⚠️ Omitiendo usuario ${userId}: no existe en Clerk`);
          return null;
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

        // promedios por parámetro (solo si tiene actividades)
        const parametroGrades = await db
          .select({
            parametroId: parametros.id,
            parametroName: parametros.name,
            parametroPeso: parametros.porcentaje,
            avgGrade: sql<number>`
              COALESCE(AVG(${userActivitiesProgress.finalGrade}), 0)::float
            `.as('avg_grade'),
          })
          .from(userActivitiesProgress)
          .innerJoin(
            activities,
            eq(userActivitiesProgress.activityId, activities.id)
          )
          .innerJoin(parametros, eq(activities.parametroId, parametros.id))
          .where(
            and(
              eq(userActivitiesProgress.userId, userId),
              eq(parametros.courseId, courseId)
            )
          )
          .groupBy(parametros.id, parametros.name, parametros.porcentaje);

        // Fusionar TODOS los parámetros con sus promedios (o 0)
        const parameterGrades = allParametros.map((p) => {
          const found = parametroGrades.find(
            (pg) => pg.parametroId === p.parametroId
          );
          const avg = toNum(found?.avgGrade, 0);
          return {
            parametroId: p.parametroId,
            parametroName: p.parametroName,
            parametroPeso: p.parametroPeso,
            grade: round2(avg),
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
              eq(userActivitiesProgress.userId, userId)
            )
          )
          .where(eq(parametros.courseId, courseId));

        // Si no tiene actividades, construir una lista placeholder por parámetro
        if (actividadNotas.length === 0) {
          actividadNotas = allParametros.map((p) => ({
            activityId: -1,
            activityName: 'Sin actividad',
            parametroId: p.parametroId,
            parametroName: p.parametroName,
            parametroPeso: p.parametroPeso,
            actividadPeso: 0,
            grade: 0,
          }));
        }

        const meta = parsePublicMeta(clerkUser.publicMetadata);

        return {
          id: userId,
          firstName: clerkUser.firstName ?? '',
          lastName: clerkUser.lastName ?? '',
          email:
            clerkUser.emailAddresses.find(
              (email) => email.id === clerkUser.primaryEmailAddressId
            )?.emailAddress ?? '',
          createdAt: clerkUser.createdAt ?? null,
          enrolledAt: enrollment.enrolledAt ?? null,
          role: meta.role ?? 'estudiante',
          status: meta.status ?? 'activo',
          lastConnection: clerkUser.lastActiveAt ?? null,
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
            grade: toNum(a.grade, 0),
          })),
        };
      })
    )
  ).filter((u): u is NonNullable<typeof u> => u !== null);

  simplifiedUsers.forEach((user) => {
    console.log(`📝 Usuario ${user.id}`);
    console.log('  parameterGrades:', user.parameterGrades);
    console.log('  activitiesWithGrades:', user.activitiesWithGrades);
  });

  console.log('🏁 total enviados al front:', simplifiedUsers.length);
  return simplifiedUsers;
}
