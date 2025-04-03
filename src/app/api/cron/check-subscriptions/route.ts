import { type NextRequest, NextResponse } from 'next/server';

import { checkAndUpdateSubscriptions } from '~/server/actions/estudiantes/subscriptions/checkAndUpdateSubscriptions';

// Configure route behavior
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Reduced to 60 seconds
export const fetchCache = 'force-no-store';

// Types
interface CronResponse {
	message: string;
	success: boolean;
	timestamp: string;
	details?: unknown;
}

// Validation function
const validateAuth = (request: NextRequest): boolean => {
	const authHeader = request.headers.get('authorization');
	const userAgent = request.headers.get('user-agent');
	const cronSecret = process.env.CRON_SECRET;
	const isLocalhost = process.env.NODE_ENV === 'development';

	console.log('🔍 Debug Info:', {
		env: process.env.NODE_ENV,
		authHeader,
		userAgent,
		hasCronSecret: !!cronSecret,
		isLocalhost,
	});

	if (!cronSecret) return false;

	// En desarrollo, permitir cualquier solicitud con el token correcto
	if (isLocalhost && authHeader === `Bearer ${cronSecret}`) {
		return true;
	}

	// Validar autorización
	const isValidAuth = authHeader === `Bearer ${cronSecret}`;

	// En desarrollo, permitir cualquier user-agent
	const isValidUserAgent = isLocalhost
		? true
		: Boolean(userAgent?.includes('vercel-cron'));

	// Log de validación
	console.log('✓ Validation Results:', { isValidAuth, isValidUserAgent });

	// Permitir acceso local sin verificación en desarrollo
	return isLocalhost ? true : isValidAuth && isValidUserAgent;
};

export async function GET(request: NextRequest) {
	console.log(`🕒 Cron job started at: ${new Date().toISOString()}`);

	try {
		if (!validateAuth(request)) {
			console.error('🚫 Unauthorized cron attempt');
			return new Response('Unauthorized', { status: 401 });
		}

		const result = await checkAndUpdateSubscriptions();

		return new Response(
			JSON.stringify({
				success: true,
				timestamp: new Date().toISOString(),
				details: result,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-store',
				},
			}
		);
	} catch (error) {
		// Log error details
		console.error('❌ Error in subscription check:', error);

		return NextResponse.json(
			{
				message: 'Error al verificar y actualizar las suscripciones',
				success: false,
				timestamp: new Date().toISOString(),
				details: error instanceof Error ? error.message : 'Unknown error',
			} as CronResponse,
			{ status: 500 }
		);
	} finally {
		console.log('🏁 Subscription check cron job finished');
	}
}
