import { type NextRequest, NextResponse } from 'next/server';

import { env } from '~/env';
import { getAuthConfig } from '~/utils/paygateway/auth';
import { createFormData } from '~/utils/paygateway/form';

interface RequestBody {
	productId: number;
	amount: string;
	description: string;
	buyerEmail: string;
	buyerFullName: string;
	telephone: string;
}

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as RequestBody;

		// Asegurar que el monto se envía correctamente a PayU
		const formattedAmount = Number(body.amount).toFixed(2);

		const auth = getAuthConfig();
		const referenceCode = `curso_${body.productId}_${Date.now()}`;

		const formData = createFormData(
			auth,
			{
				id: body.productId,
				name: body.description,
				amount: formattedAmount, // Aquí ya está formateado correctamente
				description: `Curso Individual: ${body.description}`,
				referenceCode: referenceCode,
			},
			body.buyerEmail,
			body.buyerFullName,
			body.telephone,
			`${env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${body.productId}`,
			`${env.NEXT_PUBLIC_BASE_URL}/api/confirmPayment` // Usar la misma ruta de confirmación que los planes
		);

		console.log('Generated payment data:', formData);
		return NextResponse.json(formData);
	} catch (error) {
		console.error('Error generating payment data:', error);
		return NextResponse.json(
			{ error: 'Failed to generate payment data' },
			{ status: 500 }
		);
	}
}
