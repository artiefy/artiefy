import { type NextRequest, NextResponse } from 'next/server';

import { checkAndUpdateSubscriptions } from '~/server/actions/estudiantes/subscriptions/checkAndUpdateSubscriptions';

// Configure route behavior
export const dynamic = 'force-dynamic';

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

	console.log('🔒 Validating cron request at:', new Date().toISOString());
	console.log('- Request Path:', request.nextUrl.pathname);
	console.log('- User Agent:', userAgent);

	if (!cronSecret || typeof cronSecret !== 'string') {
		console.error('❌ CRON_SECRET is not properly configured');
		return false;
	}

	const expectedAuth = `Bearer ${cronSecret}`;
	const isValidAuth = authHeader === expectedAuth;
	const isValidUserAgent = Boolean(userAgent?.includes('vercel-cron')); // Force boolean

	if (!isValidAuth) console.warn('❌ Invalid authorization header');
	if (!isValidUserAgent) console.warn('❌ Invalid user agent');

	return Boolean(isValidAuth && isValidUserAgent); // Force boolean return
};

export async function GET(request: NextRequest) {
	console.log(`🕒 Cron job started at: ${new Date().toISOString()}`);

	// Validación estricta
	if (!validateAuth(request)) {
		console.error('🚫 Unauthorized cron attempt');
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		// Añadir un timeout de seguridad
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Timeout')), 290000); // 290s para permitir cleanup
		});

		const result = await Promise.race([
			checkAndUpdateSubscriptions(),
			timeoutPromise,
		]);

		return NextResponse.json({
			success: true,
			timestamp: new Date().toISOString(),
			details: result,
		});
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
