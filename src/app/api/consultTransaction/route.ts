import axios, { AxiosError } from 'axios';
import { type NextRequest, NextResponse } from 'next/server';

// Configure route behavior
export const dynamic = 'force-dynamic';

// Constants
const PAYU_API_URL =
	'https://sandbox.api.payulatam.com/reports-api/4.0/service.cgi';

// Types
interface RequestBody {
	orderId?: string;
	transactionId?: string;
	referenceCode?: string;
}

interface PayUAuth {
	apiLogin: string;
	apiKey: string;
}

interface PayURequestBody {
	test: boolean;
	language: string;
	command: string;
	merchant: PayUAuth;
	details: {
		orderId?: string;
		transactionId?: string;
		referenceCode?: string;
	};
}

// Validation function
const validateRequest = (body: RequestBody): string | null => {
	if (!body.orderId && !body.transactionId && !body.referenceCode) {
		return 'At least one identifier (orderId, transactionId, or referenceCode) is required';
	}
	return null;
};

// Get PayU request body based on provided identifiers
const getRequestBody = (body: RequestBody, auth: PayUAuth): PayURequestBody => {
	if (body.orderId) {
		return {
			test: false,
			language: 'en',
			command: 'ORDER_DETAIL',
			merchant: auth,
			details: { orderId: body.orderId },
		};
	}

	if (body.transactionId) {
		return {
			test: false,
			language: 'en',
			command: 'TRANSACTION_RESPONSE_DETAIL',
			merchant: auth,
			details: { transactionId: body.transactionId },
		};
	}

	return {
		test: false,
		language: 'en',
		command: 'ORDER_DETAIL_BY_REFERENCE_CODE',
		merchant: auth,
		details: { referenceCode: body.referenceCode },
	};
};

export async function POST(req: NextRequest) {
	try {
		// Validate environment variables
		const apiLogin = process.env.API_LOGIN;
		const apiKey = process.env.API_KEY;

		if (!apiLogin || !apiKey) {
			console.error('❌ Missing PayU API credentials');
			return NextResponse.json(
				{ error: 'Server configuration error' },
				{ status: 500 }
			);
		}

		// Parse and validate request body
		const body = (await req.json()) as RequestBody;
		const validationError = validateRequest(body);

		if (validationError) {
			return NextResponse.json({ error: validationError }, { status: 400 });
		}

		// Configure auth
		const auth: PayUAuth = { apiLogin, apiKey };

		// Get appropriate request body
		const requestBody = getRequestBody(body, auth);

		// Make request to PayU
		console.log('📤 Sending request to PayU:', {
			...requestBody,
			merchant: { ...requestBody.merchant, apiKey: '***' },
		});

		const response = await axios.post<{ data: Record<string, unknown> }>(
			PAYU_API_URL,
			requestBody,
			{
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				timeout: 10000, // 10 second timeout
			}
		);

		console.log('✅ PayU response received');

		return NextResponse.json({
			success: true,
			data: response.data,
		});
	} catch (error) {
		console.error('❌ Error in transaction consultation:', error);

		if (error instanceof AxiosError) {
			return NextResponse.json(
				{
					error: 'PayU API error',
					message:
						(error.response?.data as { message?: string })?.message ??
						error.message,
					status: error.response?.status ?? 500,
				},
				{
					status: error.response?.status ?? 500,
				}
			);
		}

		return NextResponse.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}
