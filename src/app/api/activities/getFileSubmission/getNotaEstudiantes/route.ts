import { type NextRequest, NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  activities,
  lessons,
  parametros,
  userActivitiesProgress,
} from '~/server/db/schema';
import { authorizeStaff } from '~/server/utils/apiAuth';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface ActividadConNota {
  activityId: number;
  activityName: string;
  porcentaje: number;
  grade: number | null;
}

interface ParametroGroup {
  parametroId: number;
  parametroNombre: string;
  parametroPorcentaje: number;
  actividades: ActividadConNota[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    if (!courseId || !userId) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // Security best practice: reading a course-wide grade consolidation is a
    // staff action (educator/admin dashboards).
    const authz = await authorizeStaff();
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

    const courseIdParsed = parseInt(courseId, 10);
    if (isNaN(courseIdParsed)) {
      return NextResponse.json({ error: 'courseId inválido' }, { status: 400 });
    }

    const rows = await db
      .select({
        parametroId: parametros.id,
        parametroNombre: parametros.name,
        parametroPorcentaje: parametros.porcentaje,
        activityId: activities.id,
        activityName: activities.name,
        activityPorcentaje: activities.porcentaje,
        grade: userActivitiesProgress.finalGrade,
      })
      .from(activities)
      .innerJoin(lessons, eq(activities.lessonsId, lessons.id))
      .innerJoin(parametros, eq(activities.parametroId, parametros.id))
      .leftJoin(
        userActivitiesProgress,
        and(
          eq(userActivitiesProgress.activityId, activities.id),
          eq(userActivitiesProgress.userId, userId)
        )
      )
      .where(eq(lessons.courseId, courseIdParsed));

    if (!rows.length) {
      return NextResponse.json({ parametros: [], notaFinal: '0.00' });
    }

    const parametrosMap: Map<number, ParametroGroup> = new Map();

    for (const row of rows) {
      if (!parametrosMap.has(row.parametroId)) {
        parametrosMap.set(row.parametroId, {
          parametroId: row.parametroId,
          parametroNombre: row.parametroNombre,
          parametroPorcentaje: row.parametroPorcentaje,
          actividades: [],
        });
      }
      const grupo = parametrosMap.get(row.parametroId);
      if (grupo) {
        grupo.actividades.push({
          activityId: row.activityId,
          activityName: row.activityName,
          porcentaje: row.activityPorcentaje ?? 0,
          grade: row.grade,
        });
      }
    }

    let notaFinalAcumulada = 0;
    let sumaPesosParametros = 0;

    const parametrosResult = Array.from(parametrosMap.values()).map((param) => {
      let sumaNotas = 0;
      let sumaPesosActividades = 0;

      param.actividades.forEach((act) => {
        const nota = act.grade ?? 0;
        sumaNotas += nota * (act.porcentaje / 100);
        sumaPesosActividades += act.porcentaje / 100;
      });

      const promedioParametro =
        sumaPesosActividades > 0 ? sumaNotas / sumaPesosActividades : 0;

      notaFinalAcumulada +=
        promedioParametro * (param.parametroPorcentaje / 100);
      sumaPesosParametros += param.parametroPorcentaje / 100;

      return {
        ...param,
        promedioParametro: Number(promedioParametro.toFixed(2)),
      };
    });

    const notaFinal =
      sumaPesosParametros > 0
        ? (notaFinalAcumulada / sumaPesosParametros).toFixed(2)
        : '0.00';

    return NextResponse.json({
      parametros: parametrosResult,
      notaFinal,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error fetching grades' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Security best practice: writing a student's grade is a staff action.
    const authz = await authorizeStaff();
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.status === 401 ? 'No autorizado' : 'Acceso denegado' },
        { status: authz.status }
      );
    }

    const rawBody: unknown = await request.json();

    if (
      typeof rawBody !== 'object' ||
      rawBody === null ||
      !('activityId' in rawBody) ||
      !('userId' in rawBody) ||
      !('grade' in rawBody)
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { activityId, userId, grade } = rawBody as {
      activityId: number;
      userId: string;
      grade: number;
    };

    if (!activityId || !userId || grade === undefined) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // 1. PostgreSQL
    await db
      .insert(userActivitiesProgress)
      .values({
        userId,
        activityId,
        finalGrade: grade,
        isCompleted: true,
        progress: 100,
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          userActivitiesProgress.userId,
          userActivitiesProgress.activityId,
        ],
        set: {
          finalGrade: grade,
          lastUpdated: new Date(),
        },
      });

    // 2. Redis
    const submissionKey = `activity:${activityId}:user:${userId}:submission`;

    const submission = {
      grade,
      feedback: null,
    };

    await redis.set(submissionKey, submission, { ex: 60 * 60 * 24 * 30 });

    return NextResponse.json({ success: true, grade });
  } catch {
    return NextResponse.json(
      { error: 'Error updating grade' },
      { status: 500 }
    );
  }
}
