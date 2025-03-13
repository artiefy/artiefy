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
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret) {
		console.error('❌ CRON_SECRET environment variable is not set');
		return false;
	}

	return authHeader === `Bearer ${cronSecret}`;
};

export async function GET(request: NextRequest) {
	console.log('🕒 Starting subscription check cron job');

	// Validate authentication
	if (!validateAuth(request)) {
		console.warn('⚠️ Unauthorized cron job attempt');
		return NextResponse.json(
			{
				message: 'Unauthorized',
				success: false,
				timestamp: new Date().toISOString(),
			} as CronResponse,
			{ status: 401 }
		);
	}

	try {
		// Execute subscription check
		console.log('✓ Authentication successful, checking subscriptions...');
		const result = await checkAndUpdateSubscriptions();

		// Log success and return response
		console.log('✅ Subscription check completed successfully');
		return NextResponse.json({
			message: 'Suscripciones verificadas y actualizadas exitosamente',
			success: true,
			timestamp: new Date().toISOString(),
			details: result,
		} as CronResponse);
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
