import { env } from '~/env';
import { type Auth, type FormData, type Product } from '~/types/payu';

import { calculateSignature } from './signature';

export function createFormData(
	auth: Auth,
	product: Product,
	buyerEmail: string,
	buyerFullName: string,
	telephone: string,
	responseUrl: string,
	paymentType: 'course' | 'plan' // Changed from boolean to union type
): FormData {
	// Calcular montos con precisión
	const amount = Number(product.amount);
	const formattedAmount = amount.toFixed(2);
	const tax = Math.round(amount * 0.19).toFixed(2); // 19% IVA
	const taxReturnBase = (amount - Number(tax)).toFixed(2);
	const currency = 'COP';

	// Generar referenceCode único combinando ID del curso y timestamp
	const timestamp = Date.now();
	const cleanProductName = product.name.replace(/\s*Premium\s*/g, '').trim();
	const cleanDescription =
		paymentType === 'plan' ? `Plan ${product.name}` : product.description;
	const referenceCode =
		paymentType === 'course'
			? `C${product.id}T${timestamp}` // Format: C{courseId}T{timestamp}
			: `${cleanProductName}_${timestamp}`; // Incluir el nombre del plan en la referencia

	// Generar signature con formato correcto
	const signature = calculateSignature(
		auth.apiKey,
		auth.merchantId,
		referenceCode,
		formattedAmount,
		currency
	);

	// Select correct confirmation URL based on payment type
	const confirmationUrl =
		paymentType === 'course'
			? env.CONFIRMATION_URL_COURSES
			: env.CONFIRMATION_URL_PLANS;

	return {
		merchantId: auth.merchantId,
		accountId: auth.accountId,
		description: cleanDescription,
		referenceCode,
		amount: formattedAmount,
		tax,
		taxReturnBase,
		currency,
		signature,
		test: '0',
		buyerEmail,
		buyerFullName,
		telephone,
		responseUrl,
		confirmationUrl, // Esta URL determinará a qué endpoint se envía la confirmación
	} satisfies FormData;
}
