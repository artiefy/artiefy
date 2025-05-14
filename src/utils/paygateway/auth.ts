import { env } from '~/env';
import { type Auth } from '~/types/payu';

// Función para obtener las variables de entorno para la autenticación
export function getAuthConfig(): Auth {
	const merchantId = env.MERCHANT_ID;
	const accountId = env.ACCOUNT_ID;
	const apiLogin = env.API_LOGIN;
	const apiKey = env.API_KEY;

	if (!merchantId || !accountId || !apiLogin || !apiKey) {
		throw new Error('Missing authentication configuration');
	}

	console.log('Environment variables:', {
		merchantId,
		accountId,
		apiLogin,
		apiKey,
	});

	return {
		merchantId,
		accountId,
		apiLogin,
		apiKey,
	};
}