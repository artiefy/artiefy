import { type FormData, type Auth, type Product } from '~/types/payu';

import { calculateSignature } from './signature';

export function createFormData(
	auth: Auth,
	product: Product,
	buyerEmail: string,
	buyerFullName: string,
	telephone: string,
	responseUrl: string,
	confirmationUrl: string
): FormData {
	// Calcular montos con precisión
	const amount = Number(product.amount);
	const formattedAmount = amount.toFixed(2);
	const tax = Math.round(amount * 0.19).toFixed(2); // 19% IVA
	const taxReturnBase = (amount - Number(tax)).toFixed(2);
	const currency = 'COP';

	// Generar referenceCode único
	const timestamp = Date.now();
	const referenceCode = `${timestamp}`;

	// Generar signature con formato correcto
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
		referenceCode,
		amount: formattedAmount,
		tax,
		taxReturnBase,
		currency,
		signature,
		test: '1',
		buyerEmail,
		buyerFullName,
		telephone,
		responseUrl,
		confirmationUrl,
	};
}
