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
	sign: string; // ✅ Ahora siempre es un string
	transaction_id: string;
	description: string;
}

export async function POST(req: NextRequest) {
	if (req.method !== 'POST') {
		return NextResponse.json(
			{ message: 'Method not allowed' },
			{ status: 405 }
		);
	}

	try {
		const formData = await req.formData();

		// ✅ Verificar que `sign` existe antes de asignarlo
		const sign = formData.get('sign');
		if (!sign || typeof sign !== 'string') {
			console.error('❌ Error: No se recibió la firma.');
			return NextResponse.json(
				{ message: 'Missing signature' },
				{ status: 400 }
			);
		}

		// ✅ Ahora `sign` nunca será undefined
		const paymentData: PaymentData = {
			email_buyer: formData.get('email_buyer') as string,
			state_pol: formData.get('state_pol') as string,
			merchant_id: formData.get('merchant_id') as string,
			reference_sale: formData.get('reference_sale') as string,
			value: formData.get('value') as string,
			currency: formData.get('currency') as string,
			sign: sign, // ✅ Garantizamos que sign es `string`
			transaction_id: formData.get('transaction_id') as string,
			description: formData.get('description') as string,
		};

		console.log('✅ Datos recibidos de PayU:', paymentData);

		if (!verifySignature(paymentData)) {
			console.error('❌ Firma inválida.');
			return NextResponse.json(
				{ message: 'Invalid signature' },
				{ status: 400 }
			);
		}

		if (paymentData.state_pol === '4') {
			// Verificar si es un curso individual por la descripción
			if (paymentData.description?.startsWith('Curso:')) {
				const courseId = extractCourseId(paymentData.reference_sale);
				if (!courseId) {
					throw new Error('Invalid course reference');
				}
				await enrollUserInCourse(paymentData.email_buyer, courseId);
			} else {
				// Es una suscripción normal
				await updateUserSubscription(paymentData);
			}
		} else {
			console.warn(
				`⚠️ Pago con estado ${paymentData.state_pol}, no se actualiza suscripción.`
			);
		}

		return NextResponse.json({ message: 'Payment confirmed' });
	} catch (error) {
		console.error('❌ Error en el endpoint de confirmación:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

// Función auxiliar para extraer el ID del curso
function extractCourseId(reference: string): number {
	const match = /curso_(\d+)/.exec(reference);
	return match ? parseInt(match[1]) : 0;
}
