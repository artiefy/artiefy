import { type FormData, type Auth, type Product } from '~/types/payu';

import { generateReferenceCode } from './referenceCode';
import { calculateSignature } from './signature';

// ✅ Función para formatear `amount` correctamente
function formatAmount(amount: number | string): string {
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (isNaN(numAmount) || numAmount <= 0) {
		throw new Error(`Invalid amount: ${amount}`);
	}
	// Asegurar que siempre tenga 2 decimales para PayU
	return numAmount.toFixed(2);
}

// ✅ Crear datos del formulario (genera referenceCode dinámico)
export function createFormData(
	auth: Auth,
	product: Product,
	buyerEmail: string,
	buyerFullName: string,
	telephone: string,
	responseUrl: string,
	confirmationUrl: string
): FormData {
	const referenceCode = product.referenceCode ?? generateReferenceCode();
	const formattedAmount = formatAmount(product.amount);
	const currency = 'COP';

	// Usar el responseUrl proporcionado o crear uno basado en el tipo de producto
	const finalResponseUrl =
		responseUrl ||
		(product.name.startsWith('Curso:')
			? `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/cursos/${product.id}`
			: `${process.env.NEXT_PUBLIC_BASE_URL}/estudiantes/myaccount`);

	// ✅ Generar firma MD5 con el formato correcto
	const signature = calculateSignature(
		auth.apiKey,
		auth.merchantId,
		referenceCode,
		formattedAmount,
		currency
	);

	return {
		merchantId: auth.merchantId,
		accountId: auth.accountId,
		description: product.description,
		referenceCode: referenceCode,
		amount: formattedAmount,
		tax: '3193',
		taxReturnBase: '16806',
		currency: currency,
		signature: signature,
		test: '1',
		buyerEmail: buyerEmail,
		buyerFullName: buyerFullName,
		telephone: telephone,
		responseUrl: finalResponseUrl,
		confirmationUrl: confirmationUrl,
	};
}
