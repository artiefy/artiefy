import { type NextRequest, NextResponse } from 'next/server';

import { updateUserSubscription } from '~/server/actions/estudiantes/confirmation/updateUserSubscription';
import { verifySignature } from '~/utils/paygateway/verifySignature';

export const dynamic = 'force-dynamic';

interface PaymentData {
	email_buyer: string;
	state_pol: string;
	merchant_id: string;
	reference_sale: string;
	value: string;
	currency: string;
	sign: string;
}

export async function POST(req: NextRequest) {
	// if (req.method !== 'POST') {
	// 	return NextResponse.json(
	// 		{ message: 'Method not allowed' },
	// 		{ status: 405 }
	// 	);
	// }

	try {
		const formData = await req.formData();
		const paymentData: PaymentData = {
			email_buyer: formData.get('email_buyer') as string,
			state_pol: formData.get('state_pol') as string,
			merchant_id: formData.get('merchant_id') as string,
			reference_sale: formData.get('reference_sale') as string,
			value: formData.get('value') as string,
			currency: formData.get('currency') as string,
			sign: formData.get('sign') as string,
		};

		console.log('💳 Plan subscription payment data:', paymentData);

		if (!verifySignature(paymentData)) {
			console.error('❌ Invalid signature for plan payment');
			return NextResponse.json(
				{ message: 'Invalid signature' },
				{ status: 400 }
			);
		}

		// Estado 4 significa "Aprobada"
		if (paymentData.state_pol === '4') {
			console.log('✅ Plan payment approved, updating subscription...');
			await updateUserSubscription(paymentData);

			return NextResponse.json({
				message: 'Subscription payment confirmed and processed',
				status: 'APPROVED',
			});
		}

		// Si el estado no es 4, devolver estado actual
		return NextResponse.json({
			message: 'Payment processed but not approved',
			status: paymentData.state_pol,
		});
	} catch (error) {
		console.error('❌ Error in plan payment confirmation:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
