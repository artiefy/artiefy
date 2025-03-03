import { type FormData, type Auth, type Product } from '~/types/payu';
import { generateReferenceCode } from './referenceCode';
import { calculateMD5 } from './signature';

export function createFormData(
	auth: Auth,
	product: Product,
	buyerEmail: string,
	buyerFullName: string,
	telephone: string,
	responseUrl: string,
	confirmationUrl: string
): FormData {
	// Validar que los campos requeridos no estén vacíos
	if (!auth.merchantId || !auth.accountId) {
		throw new Error('merchantId y accountId son requeridos');
	}

	if (!product.description || !product.amount) {
		throw new Error('description y amount son requeridos');
	}

	const referenceCode = generateReferenceCode();
	const formattedAmount = formatAmount(product.amount);
	const currency = 'COP';

	// Validar que todos los campos requeridos tengan valor
	const formData: FormData = {
		merchantId: auth.merchantId,
		accountId: auth.accountId,
		description: product.description,
		referenceCode: referenceCode,
		amount: formattedAmount,
		tax: '3193',
		taxReturnBase: '16806',
		currency: currency,
		signature: calculateMD5(
			auth.apiKey,
			auth.merchantId,
			referenceCode,
			formattedAmount,
			currency
		),
		test: '1',
		buyerEmail,
		buyerFullName,
		telephone,
		responseUrl,
		confirmationUrl,
	};

	// Validación final de campos requeridos
	const requiredFields = [
		'merchantId',
		'accountId',
		'description',
		'referenceCode',
		'amount',
	];
	for (const field of requiredFields) {
		if (!formData[field as keyof FormData]) {
			throw new Error(`El campo ${field} no puede estar vacío`);
		}
	}

	return formData;
}

function formatAmount(amount: number | string): string {
	const numAmount = Number(amount);
	if (isNaN(numAmount) || numAmount <= 0) {
		throw new Error(`Monto inválido: ${amount}`);
	}
	return numAmount.toFixed(2);
}
