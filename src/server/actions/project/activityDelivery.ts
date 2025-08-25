import { and,eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectActivityDeliveries } from '~/server/db/schema';

// Crear o actualizar entrega
export async function entregarActividad({
  activityId,
  userId,
  entregaUrl,
  comentario,
}: {
  activityId: number;
  userId: string;
  entregaUrl?: string;
  comentario?: string;
}) {
  // Generar key única para S3
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const s3Key = `entregas/actividad-${activityId}/usuario-${userId}/${timestamp}`;

  console.log(`🚀 ENTREGA INICIADA - Key S3: ${s3Key}`);
  console.log(`📁 Actividad ID: ${activityId}, Usuario ID: ${userId}`);

  // upsert: si existe, actualiza; si no, crea
  const existing = await db
    .select()
    .from(projectActivityDeliveries)
    .where(
      and(
        eq(projectActivityDeliveries.activityId, activityId),
        eq(projectActivityDeliveries.userId, userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // update
    const _result = await db
      .update(projectActivityDeliveries)
      .set({
        entregado: true,
        entregaUrl: entregaUrl ?? s3Key, // usar s3Key si no hay entregaUrl
        comentario,
        entregadoAt: new Date(),
        aprobado: false, // al volver a entregar, se pone en evaluación
        aprobadoAt: null,
        feedback: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectActivityDeliveries.activityId, activityId),
          eq(projectActivityDeliveries.userId, userId)
        )
      );

    console.log(`✅ ENTREGA ACTUALIZADA - S3 Key: ${s3Key}`);
    console.log(`📝 Comentario: ${comentario ?? 'Sin comentario'}`);
  } else {
    // insert
    const _result = await db.insert(projectActivityDeliveries).values({
      activityId,
      userId,
      entregado: true,
      entregaUrl: entregaUrl ?? s3Key, // usar s3Key si no hay entregaUrl
      comentario,
      entregadoAt: new Date(),
      aprobado: false,
      updatedAt: new Date(),
    });

    console.log(`🆕 NUEVA ENTREGA CREADA - S3 Key: ${s3Key}`);
    console.log(`📝 Comentario: ${comentario ?? 'Sin comentario'}`);
  }

  console.log(
    `💾 ENTREGA REGISTRADA EN BD - Timestamp: ${new Date().toISOString()}`
  );

  return {
    success: true,
    s3Key,
    entregadoAt: new Date(),
  };
}

// Aprobar entrega (solo responsable)
export async function aprobarEntrega({
  activityId,
  userId,
  feedback,
}: {
  activityId: number;
  userId: string;
  feedback?: string;
}) {
  await db
    .update(projectActivityDeliveries)
    .set({
      aprobado: true,
      aprobadoAt: new Date(),
      feedback,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projectActivityDeliveries.activityId, activityId),
        eq(projectActivityDeliveries.userId, userId)
      )
    );
}

// Eliminar entrega (soft delete: solo marca como no entregado)
export async function eliminarEntrega({
  activityId,
  userId,
}: {
  activityId: number;
  userId: string;
}) {
  await db
    .update(projectActivityDeliveries)
    .set({
      entregado: false,
      aprobado: false, // Cambiar de false a false (mantener consistencia)
      entregaUrl: null,
      comentario: null,
      feedback: null,
      entregadoAt: null,
      aprobadoAt: null,
      // Agregar campos nuevos para mantener consistencia
      documentKey: null,
      documentName: null,
      imageKey: null,
      imageName: null,
      videoKey: null,
      videoName: null,
      compressedFileKey: null,
      compressedFileName: null,
      fileTypes: null,
      totalFiles: 0,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(projectActivityDeliveries.activityId, activityId),
        eq(projectActivityDeliveries.userId, userId)
      )
    );
}

// Consultar estado de entrega
export async function getEntregaActividad({
  activityId,
  userId,
}: {
  activityId: number;
  userId: string;
}) {
  return db.query.projectActivityDeliveries.findFirst({
    where: and(
      eq(projectActivityDeliveries.activityId, activityId),
      eq(projectActivityDeliveries.userId, userId)
    ),
  });
}
