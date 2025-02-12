import { type Auth } from '~/types/payu';

// Función para obtener las variables de entorno para la autenticación
export function getAuthConfig(): Auth {
	return {
		merchantId: process.env.MERCHANT_ID ?? '',
		accountId: process.env.ACCOUNT_ID ?? '',
		apiLogin: process.env.API_LOGIN ?? '',
		apiKey: process.env.API_KEY ?? '',
	};
}
