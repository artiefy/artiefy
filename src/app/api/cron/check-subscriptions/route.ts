import { type NextRequest, NextResponse } from 'next/server';
import { checkAndUpdateSubscriptions } from '~/server/actions/estudiantes/subscriptions/checkAndUpdateSubscriptions';

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get('authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', {
			status: 401,
		});
	}

	try {
		await checkAndUpdateSubscriptions();
		return NextResponse.json({
			message: 'Suscripciones verificadas y actualizadas',
		});
	} catch (error) {
		console.error(error);
		return new Response('Error al verificar y actualizar las suscripciones', {
			status: 500,
		});
	}
}
