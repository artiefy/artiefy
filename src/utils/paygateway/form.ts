import { type FormData, type Auth, type Product } from '~/types/payu';

import { generateReferenceCode } from './referenceCode';
import { calculateSignature } from './signature';

// ✅ Función para formatear `amount` correctamente
function formatAmount(amount: number | string): string {
	const numAmount = Number(amount);
	if (isNaN(numAmount) || numAmount <= 0) {
		throw new Error(`Invalid amount: ${amount}`);
	}
	return numAmount % 1 === 0 ? numAmount.toFixed(1) : numAmount.toFixed(2);
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
	const referenceCode = generateReferenceCode(); // ✅ Se genera aquí en cada compra
	const formattedAmount = formatAmount(product.amount);
	const currency = 'COP';

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
		referenceCode: referenceCode, // ✅ Se usa el referenceCode dinámico aquí
		amount: formattedAmount,
		tax: '3193', // Ajustable según el producto
		taxReturnBase: '16806', // Ajustable según el producto
		currency: currency,
		signature: signature,
		test: '1',
		buyerEmail: buyerEmail,
		buyerFullName: buyerFullName,
		telephone: telephone,
		responseUrl: responseUrl,
		confirmationUrl: confirmationUrl,
	};
}