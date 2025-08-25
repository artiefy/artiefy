import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { projectActivityDeliveries, users } from '~/server/db/schema';

const respondWithError = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

// GET - Obtener todas las entregas de una actividad
export async function GET(
  _req: Request,
  context: {
    params: Promise<{
      id: string;
      activityId: string;
    }>;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) return respondWithError('No autorizado', 401);

    // Verificar que el usuario sea educador, admin o super-admin
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !['educador', 'admin', 'super-admin'].includes(user.role)) {
      return respondWithError(
        'No tienes permisos para ver todas las entregas',
        403
      );
    }

    const { activityId } = await context.params;
    const activityIdNum = Number(activityId);
    if (isNaN(activityIdNum))
      return respondWithError('ID de actividad inválido', 400);

    const deliveries = await db
      .select({
        delivery: projectActivityDeliveries,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(projectActivityDeliveries)
      .innerJoin(users, eq(projectActivityDeliveries.userId, users.id))
      .where(eq(projectActivityDeliveries.activityId, activityIdNum))
      .orderBy(projectActivityDeliveries.entregadoAt);

    return NextResponse.json(deliveries);
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    return respondWithError('Error al obtener las entregas', 500);
  }
}
