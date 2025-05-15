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

		// Limpiar la descripción - quitar "Curso Individual:"
		const cleanDescription = body.description.replace(
			/^Curso Individual:\s*/i,
			''
		);

		const auth = getAuthConfig();
		const formattedAmount = Number(body.amount).toFixed(2);

		const formData = createFormData(
			auth,
			{
				id: body.productId,
				name: cleanDescription,
				amount: formattedAmount,
				description: cleanDescription, // Usar la descripción limpia
			},
			body.buyerEmail,
			body.buyerFullName,
			body.telephone,
			`${env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${body.productId}`,
			'course' // Specify payment type as course
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
