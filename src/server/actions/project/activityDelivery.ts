import { db } from '~/server/db';
import { projectActivityDeliveries } from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';

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
    await db
      .update(projectActivityDeliveries)
      .set({
        entregado: true,
        entregaUrl,
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
  } else {
    // insert
    await db.insert(projectActivityDeliveries).values({
      activityId,
      userId,
      entregado: true,
      entregaUrl,
      comentario,
      entregadoAt: new Date(),
      aprobado: false,
      updatedAt: new Date(),
    });
  }
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
      aprobado: false,
      entregaUrl: null,
      comentario: null,
      feedback: null,
      entregadoAt: null,
      aprobadoAt: null,
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
