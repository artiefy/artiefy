import axios from 'axios';
import { type NextRequest, NextResponse } from 'next/server';

const PAYU_API_URL =
	'https://sandbox.api.payulatam.com/reports-api/4.0/service.cgi';

export async function POST(req: NextRequest) {
	try {
		interface RequestBody {
			orderId?: string;
			transactionId?: string;
			referenceCode?: string;
		}
		const { orderId, transactionId, referenceCode }: RequestBody =
			(await req.json()) as RequestBody;

		const auth = {
			apiLogin: process.env.API_LOGIN!,
			apiKey: process.env.API_KEY!,
		};

		let requestBody;

		if (orderId) {
			requestBody = {
				test: false,
				language: 'en',
				command: 'ORDER_DETAIL',
				merchant: auth,
				details: {
					orderId,
				},
			};
		} else if (transactionId) {
			requestBody = {
				test: false,
				language: 'en',
				command: 'TRANSACTION_RESPONSE_DETAIL',
				merchant: auth,
				details: {
					transactionId,
				},
			};
		} else if (referenceCode) {
			requestBody = {
				test: false,
				language: 'en',
				command: 'ORDER_DETAIL_BY_REFERENCE_CODE',
				merchant: auth,
				details: {
					referenceCode,
				},
			};
		} else {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		const response = await axios.post(PAYU_API_URL, requestBody, {
			headers: {
				'Content-Type': 'application/json',
			},
		});

		return NextResponse.json(response.data);
	} catch (error) {
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		} else {
			return NextResponse.json(
				{ error: 'An unknown error occurred' },
				{ status: 500 }
			);
		}
	}
}
