import { type NextRequest, NextResponse } from 'next/server';

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

		const auth = getAuthConfig();
		const formData = createFormData(
			auth,
			{
				id: body.productId, // Asegurarse que este es el ID del curso
				name: `Curso: ${body.description}`,
				amount: body.amount,
				description: body.description,
				referenceCode: `curso_${body.productId}_${Date.now()}`,
			},
			body.buyerEmail,
			body.buyerFullName,
			body.telephone,
			`${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${body.productId}`, // URL específica del curso
			`${process.env.NEXT_PUBLIC_BASE_URL}/api/confirmCoursePayment`
		);

		return NextResponse.json(formData);
	} catch (error) {
		console.error('Error generating payment data:', error);
		return NextResponse.json(
			{ error: 'Failed to generate payment data' },
			{ status: 500 }
		);
	}
}
