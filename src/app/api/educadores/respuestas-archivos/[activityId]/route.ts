import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(
	request: Request,
	{ params }: { params: { activityId: string } }
) {
	try {
		// Verificar autenticación
		const userId = auth();
		if (!userId) {
			return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
		}

		// Asegurarnos de que tenemos el activityId
		if (!params?.activityId) {
			return NextResponse.json(
				{ error: 'ID de actividad no proporcionado' },
				{ status: 400 }
			);
		}

		const activityId = params.activityId;
		const keys = await redis.keys(`activity:${activityId}:*`);

		if (!keys || !Array.isArray(keys)) {
			return NextResponse.json({ respuestas: {} });
		}

		const respuestas: Record<string, any> = {};
		const userIds = new Set<string>();

		// Primero recolectamos todas las respuestas y los IDs de usuario únicos
		for (const key of keys) {
			try {
				const respuesta = await redis.hgetall(key);
				if (respuesta && Object.keys(respuesta).length > 0) {
					respuestas[key] = {
						fileName: respuesta.fileName || '',
						submittedAt: respuesta.submittedAt || new Date().toISOString(),
						userId: respuesta.userId || '',
						userName: respuesta.userName || '',
						status: respuesta.status || 'pendiente',
						grade: respuesta.grade ? Number(respuesta.grade) : null,
					};
					if (respuesta.userId) {
						userIds.add(String(respuesta.userId));
					}
				}
			} catch (err) {
				console.error(`Error al obtener respuesta para key ${key}:`, err);
				continue;
			}
		}

		return NextResponse.json({ respuestas });
	} catch (error) {
		console.error('Error al obtener respuestas:', error);
		return NextResponse.json(
			{ error: 'Error al obtener las respuestas' },
			{ status: 500 }
		);
	}
}
