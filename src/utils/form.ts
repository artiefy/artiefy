import { type FormData, type Auth, type Product } from '~/types/payu';
import { getAuthConfig } from './auth';
import { getProductById } from './product';
import { calculateMD5 } from './referenceCode';

// Función que crea los datos del formulario utilizando los parámetros proporcionados
export function createFormData(
	auth: Auth,
	product: Product,
	buyerEmail: string,
	buyerFullName: string,
	telephone: string,
	responseUrl: string,
	confirmationUrl: string
): FormData {
	const signature = calculateMD5(
		auth.apiKey,
		auth.merchantId,
		product.referenceCode,
		product.amount,
		'COP'
	);

	return {
		merchantId: auth.merchantId,
		accountId: auth.accountId,
		description: product.description,
		referenceCode: product.referenceCode,
		amount: product.amount,
		tax: '3193', // Estos valores pueden ser ajustados según sea necesario
		taxReturnBase: '16806', // Estos valores pueden ser ajustados según sea necesario
		currency: 'COP',
		signature,
		test: '0',
		buyerEmail,
		buyerFullName,
		telephone,
		responseUrl,
		confirmationUrl,
	};
}

// Inicialización de los datos del formulario con valores predeterminados
export function getInitialFormData(
	productId: number,
	buyerEmail: string,
	buyerFullName: string,
	telephone: string
): FormData {
	const auth = getAuthConfig();
	const product = getProductById(productId);

	if (!product) {
		throw new Error('Producto no encontrado');
	}

	return createFormData(
		auth,
		product,
		buyerEmail,
		buyerFullName,
		telephone,
		'http://www.test.com/response',
		'http://www.test.com/confirmation'
	);
}
