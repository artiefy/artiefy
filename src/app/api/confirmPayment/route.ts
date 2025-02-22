import { type NextRequest, NextResponse } from 'next/server';
import { updateUserSubscription } from '~/server/actions/estudiantes/confirmation/updateUserSubscription';
import { verifySignature } from '~/utils/verifySignature';

interface PaymentData {
	email_buyer: string;
	state_pol: string;
	merchant_id: string;
	reference_sale: string;
	value: string;
	currency: string;
}

export async function POST(req: NextRequest) {
	if (req.method !== 'POST') {
		return NextResponse.json(
			{ message: 'Method not allowed' },
			{ status: 405 }
		);
	}

	const { signature, ...paymentData } = (await req.json()) as {
		signature: string;
	} & PaymentData;

	console.log('Received Payment Data:', paymentData); // Log the received payment data
	console.log('Received Signature:', signature); // Log the received signature

	// Verificar la firma
	if (!verifySignature(paymentData, signature)) {
		console.log('Invalid Signature'); // Log invalid signature
		return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
	}

	// Actualizar la suscripción del usuario
	await updateUserSubscription(paymentData);

	return NextResponse.json({ message: 'Payment confirmed' });
}
