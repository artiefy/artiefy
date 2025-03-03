import { NextResponse } from 'next/server';
import { env } from '~/env';
import { getAuthConfig } from '~/utils/paygateway/auth';
import { createFormData } from '~/utils/paygateway/form';
import { getProductById } from '~/utils/paygateway/products';

interface RequestBody {
	productId: number;
	buyerEmail: string;
	buyerFullName: string;
	telephone: string;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as RequestBody;
		const { productId, buyerEmail, buyerFullName, telephone } = body;

		// Validar que todos los campos necesarios estén presentes
		if (!productId || !buyerEmail || !buyerFullName || !telephone) {
			return NextResponse.json(
				{ error: 'Faltan campos requeridos' },
				{ status: 400 }
			);
		}

		const product = getProductById(productId);
		if (!product) {
			return NextResponse.json(
				{ error: 'Producto no encontrado' },
				{ status: 404 }
			);
		}

		const auth = getAuthConfig();

		// Validar que las variables de entorno estén configuradas
		if (!auth.merchantId || !auth.accountId || !auth.apiKey || !auth.apiLogin) {
			throw new Error('Faltan configuraciones de PayU');
		}

		const formData = createFormData(
			auth,
			product,
			buyerEmail,
			buyerFullName,
			telephone,
			env.RESPONSE_URL,
			env.CONFIRMATION_URL
		);

		return NextResponse.json(formData);
	} catch (error) {
		console.error('Error generando datos de pago:', error);
		return NextResponse.json(
			{ error: 'Error generando datos de pago' },
			{ status: 500 }
		);
	}
}
