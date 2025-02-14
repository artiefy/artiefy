import { type Auth } from '~/types/payu';

// Función para obtener las variables de entorno para la autenticación
export function getAuthConfig(): Auth {
	const merchantId = process.env.MERCHANT_ID ?? '';
	const accountId = process.env.ACCOUNT_ID ?? '';
	const apiLogin = process.env.API_LOGIN ?? '';
	const apiKey = process.env.API_KEY ?? '';

	console.log('Environment variables:', {
		merchantId,
		accountId,
		apiLogin,
		apiKey,
	});

	if (!merchantId || !accountId || !apiLogin || !apiKey) {
		console.error('Missing required environment variables:', {
			merchantId,
			accountId,
			apiLogin,
			apiKey,
		});
		throw new Error(
			'Missing required environment variables for authentication'
		);
	}

	return {
		merchantId,
		accountId,
		apiLogin,
		apiKey,
	};
}
