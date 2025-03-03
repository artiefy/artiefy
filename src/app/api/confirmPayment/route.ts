import { type NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '~/utils/paygateway/verifySignature';

// Types
interface PaymentData {
	email_buyer: string;
	state_pol: string;
	merchant_id: string;
	reference_sale: string;
	value: string;
	currency: string;
	sign: string;
}

// Validation function
const validateFormData = (formData: FormData): PaymentData | null => {
	const requiredFields = [
		'email_buyer',
		'state_pol',
		'merchant_id',
		'reference_sale',
		'value',
		'currency',
		'sign',
	];

	for (const field of requiredFields) {
		const value = formData.get(field);
		if (!value || typeof value !== 'string') {
			console.error(`❌ Missing or invalid field: ${field}`);
			return null;
		}
	}

	return {
		email_buyer: formData.get('email_buyer') as string,
		state_pol: formData.get('state_pol') as string,
		merchant_id: formData.get('merchant_id') as string,
		reference_sale: formData.get('reference_sale') as string,
		value: formData.get('value') as string,
		currency: formData.get('currency') as string,
		sign: formData.get('sign') as string,
	};
};

export async function POST(req: NextRequest) {
	// Method validation
	if (req.method !== 'POST') {
		return NextResponse.json(
			{ message: 'Method not allowed' },
			{ status: 405 }
		);
	}

	try {
		// Get and validate form data
		const formData = await req.formData();
		const paymentData = validateFormData(formData);

		if (!paymentData) {
			return NextResponse.json(
				{ message: 'Missing required fields' },
				{ status: 400 }
			);
		}

		console.log('✅ Datos recibidos de PayU:', paymentData);

		// Verify signature
		if (!verifySignature(paymentData)) {
			console.error('❌ Firma inválida.');
			return NextResponse.json(
				{ message: 'Invalid signature' },
				{ status: 400 }
			);
		}

		// Process payment status
		if (paymentData.state_pol === '4') {
			console.log('✅ Pago aprobado. Actualizando suscripción...');
			// await updateUserSubscription(paymentData);

			return NextResponse.json(
				{
					message: 'Payment confirmed',
					status: 'success',
				},
				{ status: 200 }
			);
		} else {
			console.warn(
				`⚠️ Pago con estado ${paymentData.state_pol}, no se actualiza suscripción.`
			);
			return NextResponse.json(
				{
					message: 'Payment not approved',
					status: paymentData.state_pol,
				},
				{ status: 200 }
			);
		}
	} catch (error) {
		console.error('❌ Error en el endpoint de confirmación:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
