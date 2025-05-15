import { type NextRequest, NextResponse } from 'next/server';

import { updateUserSubscription } from '~/server/actions/estudiantes/confirmation/updateUserSubscription';
import { enrollUserInCourse } from '~/server/actions/estudiantes/courses/enrollIndividualCourse';
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
	transaction_id: string;
	description: string;
}

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();

		const sign = formData.get('sign');
		if (!sign || typeof sign !== 'string') {
			console.error('❌ Error: No signature received');
			return NextResponse.json(
				{ message: 'Missing signature' },
				{ status: 400 }
			);
		}

		const paymentData: PaymentData = {
			email_buyer: formData.get('email_buyer') as string,
			state_pol: formData.get('state_pol') as string,
			merchant_id: formData.get('merchant_id') as string,
			reference_sale: formData.get('reference_sale') as string,
			value: formData.get('value') as string,
			currency: formData.get('currency') as string,
			sign: sign,
			transaction_id: formData.get('transaction_id') as string,
			description: formData.get('description') as string,
		};

		console.log('✅ Payment data received:', paymentData);

		if (!verifySignature(paymentData)) {
			console.error('❌ Invalid signature');
			return NextResponse.json(
				{ message: 'Invalid signature' },
				{ status: 400 }
			);
		}

		// Estado 4 significa "Aprobada"
		if (paymentData.state_pol === '4') {
			// Verificar si es un curso individual
			if (paymentData.reference_sale.startsWith('curso_')) {
				const courseId = extractCourseId(paymentData.reference_sale);
				if (!courseId) {
					throw new Error('Invalid course reference');
				}
				console.log('✅ Enrolling user in course:', courseId);
				await enrollUserInCourse(paymentData.email_buyer, courseId);
			} else {
				// Es una suscripción
				await updateUserSubscription(paymentData);
			}

			return NextResponse.json({
				message: 'Payment confirmed',
				status: 'APPROVED',
				reference: paymentData.reference_sale,
			});
		}

		console.warn(`⚠️ Payment status ${paymentData.state_pol} received`);
		return NextResponse.json({
			message: 'Payment not approved',
			status: paymentData.state_pol,
		});
	} catch (error) {
		console.error('❌ Error in payment confirmation:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

function extractCourseId(reference: string): number {
	const match = /curso_(\d+)/.exec(reference);
	return match ? parseInt(match[1]) : 0;
}
