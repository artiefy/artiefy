import { NextResponse } from 'next/server';

import { Redis } from '@upstash/redis';
import { and, eq } from 'drizzle-orm';

import { sendActivityGradeEmail } from '~/lib/emails/gradeNotification';
import { db } from '~/server/db';
import { userActivitiesProgress } from '~/server/db/schema';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface CalificacionPayload {
  activityId: string;
  questionId: string;
  userId: string;
  grade: number;
  submissionKey: string;
  comment?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CalificacionPayload;
    const { activityId, questionId, userId, grade, submissionKey, comment } =
      payload;

    console.log('📨 Payload recibido:', payload);
    console.log('🔎 Detalle:');
    console.log(' - activityId:', activityId, typeof activityId);
    console.log(' - questionId:', questionId, typeof questionId);
    console.log(' - userId:', userId, typeof userId);
    console.log(' - grade:', grade, typeof grade);
    console.log(' - submissionKey:', submissionKey, typeof submissionKey);
    console.log(' - comment:', comment, typeof comment);

    // Validaciones básicas
    if (
      !activityId?.trim() ||
      !questionId?.trim() ||
      !userId?.trim() ||
      grade === undefined ||
      !submissionKey?.trim()
    ) {
      console.error('❌ Faltan datos requeridos');
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    const cleanedKey = submissionKey.trim();
    console.log('🔑 Clave usada para Redis:', cleanedKey);

    // Traer de Redis
    const raw = await redis.get(cleanedKey);
    console.log('📦 Datos actuales desde Redis (raw):', raw);

    if (!raw || typeof raw !== 'object') {
      console.error('❌ No se encontraron datos en Redis para esa clave');
      return NextResponse.json(
        { error: 'No se encontraron datos para la respuesta' },
        { status: 404 }
      );
    }

    // Modificar y guardar en Redis
    const parsed = { ...raw } as Record<string, unknown>;
    parsed.grade = grade;
    parsed.status = 'reviewed';
    parsed.lastUpdated = new Date().toISOString();
    parsed.comment = comment ?? '';

    await redis.set(cleanedKey, parsed);
    console.log('✅ Redis actualizado con:', parsed);

    // Buscar progreso actual en DB antes de actualizar
    const existingProgress = await db
      .select()
      .from(userActivitiesProgress)
      .where(
        and(
          eq(userActivitiesProgress.userId, userId),
          eq(userActivitiesProgress.activityId, Number(activityId))
        )
      );

    console.log('🔍 Resultado antes del update en DB:', existingProgress);

    // Hacer el update
    const resultUpdate = await db
      .update(userActivitiesProgress)
      .set({
        finalGrade: grade,
        revisada: true,
        lastAttemptAt: new Date(),
      })
      .where(
        and(
          eq(userActivitiesProgress.userId, userId),
          eq(userActivitiesProgress.activityId, Number(activityId))
        )
      )
      .execute();

    console.log('✅ Resultado del update:', resultUpdate);

    await sendActivityGradeEmail({
      activityId: Number(activityId),
      userId,
      grade,
    });

    return NextResponse.json({
      success: true,
      data: parsed,
      detalle: {
        activityId,
        userId,
        updatedRows: resultUpdate,
        beforeUpdate: existingProgress,
      },
    });
  } catch (error) {
    console.error('💥 Error al calificar:', error);
    return NextResponse.json(
      {
        error: 'Error al calificar la respuesta',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
